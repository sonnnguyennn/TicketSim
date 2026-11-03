// Internal elevated installer entry point, never an API or automatic retry.
import { readFileSync,writeFileSync,existsSync,realpathSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { verifyRelease,assertOperatorToken,assertUpgradeReadiness } from './bootstrapPolicy.mjs'
import { preserveUpgradeFailure,safeUpgradeFailure } from './upgradeDiagnostics.mjs'
import { readActiveUpgrade,assertLockedRecovery,evidenceHash } from './upgradeRecovery.mjs'
import { QUALIFIED_PWSH,withQualifiedPowerShell,readQualifiedTrialReport } from './qualifiedRuntime.mjs'

const root=resolve(fileURLToPath(new URL('..',import.meta.url)))
const state='C:/ProgramData/TicketSimPilot'
let filename=`${state}/operator/m4-upgrade.json`
const json=name=>JSON.parse(readFileSync(name,'utf8'))
const save=record=>writeFileSync(filename,JSON.stringify(record,null,2))
const check=(valid,code)=>{if(!valid)throw new Error(code)}
let diagnosticStage='entry'
async function main(){
  check(process.platform==='win32'&&/^C:\\Program Files\\TicketSimPilot\\releases\\[0-9a-f-]{36}$/i.test(root)&&realpathSync(process.execPath).toLowerCase()===resolve(root,'node.exe').toLowerCase(),'PROTECTED_UPGRADE_ENTRY_REQUIRED')
  const mode=process.argv[2]
  check(['begin','resume-locked','retired','complete'].includes(mode),'UNKNOWN_UPGRADE_STAGE')
  const resuming=mode==='resume-locked'
  const active=existsSync(filename)?readActiveUpgrade(state):null
  const existing=active?.record??null
  check(mode==='begin'?!existing:resuming?existing?.phase==='locked'&&resolve(active.filename)===resolve(filename):existing&&resolve(existing.releaseRoot)===root,'UPGRADE_EXISTS_OR_RELEASE_MISMATCH')
  if(active&&!resuming)filename=active.filename
  const digest=mode==='begin'||resuming?process.argv[3]:existing.manifestSha256
  verifyRelease(root,digest)
  const expected=existing?.operatorPrincipal??json(`${state}/operator/preparation.json`).Operator
  const identity=assertOperatorToken(JSON.parse(await withQualifiedPowerShell(()=>execFileSync(QUALIFIED_PWSH,['-NoProfile','-NonInteractive','-File',resolve(root,'scripts/real-lab/Get-OperatorToken.ps1')],{encoding:'utf8',windowsHide:true,timeout:15_000}))),expected)
  const {RunControlJournal}=await import('./runControl.mjs')
  const {inspectMaintenanceState}=await import('../agent/runtimeMaintenance.mjs')
  const {assertM1Evidence}=await import('../agent/trialPermit.mjs')
  const journal=new RunControlJournal(`${state}/operator/actions.sqlite`)
  let record=existing
  try{
    if(resuming){
      diagnosticStage='review_locked_recovery'
      verifyRelease(existing.releaseRoot,existing.manifestSha256)
      const inspection=inspectMaintenanceState({agentPath:`${state}/agent/runs.sqlite`,operatorPath:`${state}/operator/actions.sqlite`,b5LeasePath:'E:/TicketSimOperatorState/b5/exclusive-lease',ownedMaintenanceId:existing.ownerId})
      assertLockedRecovery({original:existing,gates:journal.db.prepare('SELECT * FROM control_gate').all(),events:journal.db.prepare('SELECT kind,reference_id FROM control_events ORDER BY sequence').all(),
        archiveExists:{m1:existsSync(`${state}/operator/m4-previous-m1.json`),processes:existsSync(`${state}/operator/m4-previous-processes.json`)},stateClear:inspection.stateClear,resumeExists:existsSync(`${state}/operator/m4-resume.json`),
        grants:journal.db.prepare('SELECT COUNT(*) n FROM control_grants').get().n,attempts:journal.db.prepare('SELECT COUNT(*) n FROM control_attempts').get().n})
      const originalBytes=readFileSync(filename)
      filename=`${state}/operator/m4-resume.json`
      record={...existing,releaseRoot:root,manifestSha256:digest,phase:'locked',resumedAt:new Date().toISOString(),resumedFrom:{releaseRoot:existing.releaseRoot,manifestSha256:existing.manifestSha256,recordSha256:evidenceHash(originalBytes)}}
      writeFileSync(filename,JSON.stringify(record,null,2),{flag:'wx'})
      journal.recordMaintenance(record.ownerId,'maintenance_resume_reviewed')
    }
    if(mode==='begin'||resuming){
      diagnosticStage='acquire_maintenance'
      if(!resuming){
        record={ownerId:randomUUID(),releaseRoot:root,manifestSha256:digest,operatorPrincipal:identity.Principal,phase:'preparing',startedAt:new Date().toISOString()}
        writeFileSync(filename,JSON.stringify(record,null,2),{flag:'wx'})
        journal.acquireMaintenance(record.ownerId)
        record.phase='locked';save(record)
      }
      diagnosticStage='read_actual_m3_host'
      const report=await readQualifiedTrialReport()
      check(report.livePass===true&&report.runId==='76213ef3-ef9b-4bd2-9cb6-6c508dc2a92c'&&!report.b5LeaseExists,'ACTUAL_M3_NOT_VERIFIED')
      diagnosticStage='read_legacy_metadata'
      const m1=json(`${state}/operator/m1-evidence.json`),processes=json(`${state}/operator/processes.json`)
      assertM1Evidence(m1)
      check(m1.OperatorPrincipal===identity.Principal&&m1.OperatorNodePid===processes.OperatorPid&&['approved-trial','terminal-only'].includes(processes.Mode),'LEGACY_PROCESS_RECORD_MISMATCH')
      writeFileSync(`${state}/operator/m4-previous-m1.json`,JSON.stringify(m1,null,2),{flag:'wx'})
      writeFileSync(`${state}/operator/m4-previous-processes.json`,JSON.stringify(processes,null,2),{flag:'wx'})
    }
    diagnosticStage='inspect_maintenance_state'
    const gate=journal.db.prepare('SELECT * FROM control_gate').get()
    check(gate?.kind==='maintenance'&&gate.owner_id===record.ownerId,'UPGRADE_GATE_OWNER_MISMATCH')
    const inspection=inspectMaintenanceState({agentPath:`${state}/agent/runs.sqlite`,operatorPath:`${state}/operator/actions.sqlite`,b5LeasePath:'E:/TicketSimOperatorState/b5/exclusive-lease',ownedMaintenanceId:record.ownerId})
    check(inspection.stateClear,'UPGRADE_STATE_REQUIRES_REVIEW')
    if(mode==='begin'||resuming){
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
      diagnosticStage='post_upgrade_m3_host'
      assertM1Evidence(json(`${state}/operator/m1-evidence.json`))
      const report=await readQualifiedTrialReport()
      check(report.livePass===true&&!report.b5LeaseExists,'POST_UPGRADE_M3_NOT_VERIFIED')
      diagnosticStage='verify_runtime_readiness'
      const readiness=JSON.parse(await withQualifiedPowerShell(()=>execFileSync(QUALIFIED_PWSH,['-NoProfile','-NonInteractive','-File',resolve(root,'scripts/real-lab/Verify-M4Runtime.ps1')],{encoding:'utf8',windowsHide:true,timeout:20_000})))
      assertUpgradeReadiness({readiness,runtime:json(`${state}/operator/control-runtime.json`),m1:json(`${state}/operator/m1-evidence.json`),record})
      writeFileSync(`${state}/operator/m4-readiness.json`,JSON.stringify(readiness,null,2))
      journal.recordMaintenance(record.ownerId,'installation_verified')
      journal.releaseMaintenance(record.ownerId)
      record.phase='installed';record.completedAt=new Date().toISOString();save(record)
    }
    process.stdout.write(`${JSON.stringify({phase:record.phase,ownerId:record.ownerId,releaseRoot:root,noVmChangingOperation:true})}\n`)
  }catch(error){
    if(record)preserveUpgradeFailure(`${state}/operator/m4-upgrade-failure.json`,{stage:diagnosticStage,ownerId:record.ownerId,releaseRoot:root},error)
    if(record){try{journal.recordMaintenance(record.ownerId,'maintenance_failed')}catch{/* keep existing stage and gate */}}
    throw error
  }finally{journal.close()}
}
main().catch(error=>{const code=/^[A-Z0-9_]{1,80}$/.test(error?.message??'')?error.message:'UPGRADE_STAGE_FAILED';process.stderr.write(`${code}: stage=${diagnosticStage}; ${JSON.stringify(safeUpgradeFailure(error))}; retain upgrade evidence/gate; do not rerun Apply or reset\n`);process.exitCode=1})
