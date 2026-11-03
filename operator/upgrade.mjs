// Internal elevated installer entry point, never an API or automatic retry.
import { readFileSync,writeFileSync,existsSync,realpathSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { verifyRelease,assertOperatorToken,assertUpgradeReadiness } from './bootstrapPolicy.mjs'

const root=resolve(fileURLToPath(new URL('..',import.meta.url)))
const state='C:/ProgramData/TicketSimPilot',filename=`${state}/operator/m4-upgrade.json`
const json=name=>JSON.parse(readFileSync(name,'utf8'))
const save=record=>writeFileSync(filename,JSON.stringify(record,null,2))
const check=(valid,code)=>{if(!valid)throw new Error(code)}
async function main(){
  check(process.platform==='win32'&&/^C:\\Program Files\\TicketSimPilot\\releases\\[0-9a-f-]{36}$/i.test(root)&&realpathSync(process.execPath).toLowerCase()===resolve(root,'node.exe').toLowerCase(),'PROTECTED_UPGRADE_ENTRY_REQUIRED')
  const mode=process.argv[2]
  check(['begin','retired','complete'].includes(mode),'UNKNOWN_UPGRADE_STAGE')
  const existing=existsSync(filename)?json(filename):null
  check(mode==='begin'?!existing:existing&&resolve(existing.releaseRoot)===root,'UPGRADE_EXISTS_OR_RELEASE_MISMATCH')
  const digest=mode==='begin'?process.argv[3]:existing.manifestSha256
  verifyRelease(root,digest)
  const expected=existing?.operatorPrincipal??json(`${state}/operator/preparation.json`).Operator
  const identity=assertOperatorToken(JSON.parse(execFileSync(resolve(root,'powershell/pwsh.exe'),['-NoProfile','-NonInteractive','-File',resolve(root,'scripts/real-lab/Get-OperatorToken.ps1')],{encoding:'utf8',windowsHide:true,timeout:15_000})),expected)
  const {RunControlJournal}=await import('./runControl.mjs')
  const {inspectMaintenanceState}=await import('../agent/runtimeMaintenance.mjs')
  const {readActualTrialReport}=await import('../agent/trialReport.mjs')
  const {assertM1Evidence}=await import('../agent/trialPermit.mjs')
  const journal=new RunControlJournal(`${state}/operator/actions.sqlite`)
  let record=existing
  try{
    if(mode==='begin'){
      record={ownerId:randomUUID(),releaseRoot:root,manifestSha256:digest,operatorPrincipal:identity.Principal,phase:'preparing',startedAt:new Date().toISOString()}
      writeFileSync(filename,JSON.stringify(record,null,2),{flag:'wx'})
      journal.acquireMaintenance(record.ownerId)
      record.phase='locked';save(record)
      const report=await readActualTrialReport()
      check(report.livePass===true&&report.runId==='76213ef3-ef9b-4bd2-9cb6-6c508dc2a92c'&&!report.b5LeaseExists,'ACTUAL_M3_NOT_VERIFIED')
      const m1=json(`${state}/operator/m1-evidence.json`),processes=json(`${state}/operator/processes.json`)
      assertM1Evidence(m1)
      check(m1.OperatorPrincipal===identity.Principal&&m1.OperatorNodePid===processes.OperatorPid&&['approved-trial','terminal-only'].includes(processes.Mode),'LEGACY_PROCESS_RECORD_MISMATCH')
      writeFileSync(`${state}/operator/m4-previous-m1.json`,JSON.stringify(m1,null,2),{flag:'wx'})
      writeFileSync(`${state}/operator/m4-previous-processes.json`,JSON.stringify(processes,null,2),{flag:'wx'})
    }
    const gate=journal.db.prepare('SELECT * FROM control_gate').get()
    check(gate?.kind==='maintenance'&&gate.owner_id===record.ownerId,'UPGRADE_GATE_OWNER_MISMATCH')
    const inspection=inspectMaintenanceState({agentPath:`${state}/agent/runs.sqlite`,operatorPath:`${state}/operator/actions.sqlite`,b5LeasePath:'E:/TicketSimOperatorState/b5/exclusive-lease',ownedMaintenanceId:record.ownerId})
    check(inspection.stateClear,'UPGRADE_STATE_REQUIRES_REVIEW')
    if(mode==='begin'){
      journal.recordMaintenance(record.ownerId,'legacy_state_clear')
      journal.recordMaintenance(record.ownerId,'quiescing_legacy')
      record.phase='retiring';save(record)
    }else if(mode==='retired'){
      check(record.phase==='retiring','UPGRADE_PHASE_MISMATCH')
      journal.recordMaintenance(record.ownerId,'legacy_quiesced')
      journal.recordMaintenance(record.ownerId,'legacy_state_rechecked')
      record.phase='retired';save(record)
    }else{
      check(record.phase==='retired','UPGRADE_PHASE_MISMATCH')
      assertM1Evidence(json(`${state}/operator/m1-evidence.json`))
      const report=await readActualTrialReport()
      check(report.livePass===true&&!report.b5LeaseExists,'POST_UPGRADE_M3_NOT_VERIFIED')
      const readiness=JSON.parse(execFileSync(resolve(root,'powershell/pwsh.exe'),['-NoProfile','-NonInteractive','-File',resolve(root,'scripts/real-lab/Verify-M4Runtime.ps1')],{encoding:'utf8',windowsHide:true,timeout:20_000}))
      assertUpgradeReadiness({readiness,runtime:json(`${state}/operator/control-runtime.json`),m1:json(`${state}/operator/m1-evidence.json`),record})
      writeFileSync(`${state}/operator/m4-readiness.json`,JSON.stringify(readiness,null,2))
      journal.recordMaintenance(record.ownerId,'installation_verified')
      journal.releaseMaintenance(record.ownerId)
      record.phase='installed';record.completedAt=new Date().toISOString();save(record)
    }
    process.stdout.write(`${JSON.stringify({phase:record.phase,ownerId:record.ownerId,releaseRoot:root,noVmChangingOperation:true})}\n`)
  }catch(error){
    if(record){try{journal.recordMaintenance(record.ownerId,'maintenance_failed')}catch{/* keep existing stage and gate */}}
    throw error
  }finally{journal.close()}
}
main().catch(error=>{const code=/^[A-Z0-9_]{1,80}$/.test(error?.message??'')?error.message:'UPGRADE_STAGE_FAILED';process.stderr.write(`${code}: retain upgrade evidence/gate; do not rerun Apply or reset\n`);process.exitCode=1})
