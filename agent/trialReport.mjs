import { DatabaseSync } from 'node:sqlite'
import { readFileSync, existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { liveChecks, LIVE_TARGET } from './livePolicy.mjs'
import { FIRST_WEB_TRIAL, assertTrialHost } from './trialPermit.mjs'
import { runHostAction } from '../operator/server.mjs'

const checkId=(name,prefix)=>`real-${prefix}${name.replace(/[A-Z]/g,c=>`-${c.toLowerCase()}`)}-v1`
export function summarizeTrial({runs,events,leases,approvals,actions,operations}){
  const run=runs[0]??null
  const selected=events.filter(event=>event.run_id===run?.run_id)
  const results=(type,names,prefix)=>Object.fromEntries(names.map(name=>{
    const found=selected.find(event=>event.event_type===type&&event.metadata.checkId===checkId(name,prefix))
    return [name,['pass','fail','unknown'].includes(found?.metadata.outcome)?found.metadata.outcome:'unknown']
  }))
  const gradeChecks=results('grade_check',liveChecks.grade,''),baselineChecks=results('baseline_check',liveChecks.reset,'reset-')
  const claims=approvals.filter(row=>row.approval_id===FIRST_WEB_TRIAL.approvalId)
  const resets=actions.filter(row=>row.approval_id===FIRST_WEB_TRIAL.approvalId&&row.run_id===run?.run_id&&row.operation_id==='real-host-reset-v1')
  const firstGrade=selected.find(event=>event.event_type==='grade_check')
  const revoked=selected.find(event=>event.event_type==='terminal_revoked')
  const terminalRevokedBeforeGrade=!!revoked&&!!firstGrade&&revoked.sequence<firstGrade.sequence&&revoked.metadata.outcome==='pass'
  const finalized=claims.length===1&&claims[0].run_id===run?.run_id&&!!claims[0].finalized_at
  const leaseClear=leases.length===0
  const workClear=!operations.some(row=>['pending','unknown'].includes(row.status))
  const baselineVerified=Object.values(baselineChecks).every(value=>value==='pass')&&selected.some(event=>event.event_type==='baseline_checked'&&event.metadata.outcome==='pass')
  const technicalCompletion=runs.length===1&&run?.mode==='real'&&run?.vm_ref===LIVE_TARGET.vmRef&&run.phase==='completed'&&run.recovery_status==='verified'&&baselineVerified&&terminalRevokedBeforeGrade&&resets.length===1&&actions.length===1&&approvals.length===1&&resets[0].status==='pass'&&finalized&&leaseClear&&workClear
  return {approvalId:FIRST_WEB_TRIAL.approvalId,runId:run?.run_id??null,phase:run?.phase??'not_started',
    gradeStatus:run?.grade_status??null,recoveryStatus:run?.recovery_status??'not_started',
    verificationNote:run?.evidence_note??null,errorCode:run?.error_code??null,
    gradeChecks,baselineChecks,terminalRevokedBeforeGrade,resetAttempts:resets.length,
    resetOutcome:resets[0]?.status??'not_attempted',operatorFinalized:finalized,leaseClear,workClear,
    technicalCompletion,livePass:technicalCompletion&&run.grade_status==='pass'&&Object.values(gradeChecks).every(value=>value==='pass')}
}

export async function readActualTrialReport(){
  const root='C:/ProgramData/TicketSimPilot'
  const agent=new DatabaseSync(`${root}/agent/runs.sqlite`,{readOnly:true})
  let operator
  try{
    agent.exec('PRAGMA query_only=ON')
    operator=new DatabaseSync(`${root}/operator/actions.sqlite`,{readOnly:true});operator.exec('PRAGMA query_only=ON')
    const report=summarizeTrial({
      runs:agent.prepare("SELECT * FROM lab_runs WHERE mode='real' ORDER BY created_at DESC").all(),
      events:agent.prepare('SELECT * FROM lab_events ORDER BY sequence').all().map(row=>({...row,metadata:JSON.parse(row.metadata_json)})),
      leases:agent.prepare('SELECT * FROM vm_leases').all(),approvals:operator.prepare('SELECT * FROM approvals').all(),
      actions:operator.prepare('SELECT * FROM actions').all(),operations:agent.prepare('SELECT * FROM web_operations').all(),
    })
    const m1=JSON.parse(readFileSync(`${root}/operator/m1-evidence.json`,'utf8').trim())
    const host=assertTrialHost(await runHostAction('real-host-inspect-v1',FIRST_WEB_TRIAL.checkpointId))
    return {...report,agentPrincipal:m1.AgentPrincipal,operatorPrincipal:m1.OperatorPrincipal,
      vmId:LIVE_TARGET.vmId,checkpointId:FIRST_WEB_TRIAL.checkpointId,host,
      b5LeaseExists:existsSync('E:/TicketSimOperatorState/b5/exclusive-lease'),checkedAt:new Date().toISOString()}
  }finally{operator?.close();agent.close()}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  readActualTrialReport().then(report=>process.stdout.write(`${JSON.stringify(report,null,2)}\n`)).catch(()=>{process.stderr.write('TRIAL_REPORT_VERIFICATION_FAILED: read-only check failed; no journal or lease was edited\n');process.exitCode=1})
}
