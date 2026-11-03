import { expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, sep, join } from 'node:path'
import { FIRST_WEB_TRIAL, assertM1Evidence, assertUnusedTrial, assertTrialHost, makeTrialPermit, readTrialState } from './trialPermit.mjs'
import { LIVE_TARGET, liveChecks } from './livePolicy.mjs'
import { summarizeTrial } from './trialReport.mjs'
import { LabStore } from './store.mjs'
import { OperatorJournal } from '../operator/server.mjs'

const m1=()=>({Pass:true,TlsVerified:true,AgentPrincipal:'SONNGUYEN\\TicketSimAgent',OperatorPrincipal:'SONNGUYEN\\Admin',Runtime:{principal:'SONNGUYEN\\TicketSimAgent',privileged:false,hypervReadable:false},AgentEvidence:{Pass:true,Principal:'SONNGUYEN\\TicketSimAgent',AdministratorMember:false,HyperVMember:false,HyperVReadable:false,WriteAccess:{
  'C:\\ProgramData\\TicketSimPilot\\agent':true,'C:\\Program Files\\TicketSimPilot':false,'C:\\ProgramData\\TicketSimPilot\\operator':false,'E:\\TicketSimVMs\\ticketsim-lab\\ubuntu.vhdx':false,'C:\\TicketSimBackups\\baseline-2b9c2170-20261029\\ticketsim-lab\\Virtual Hard Disks\\ubuntu.vhdx':false}}})
const host=()=>({targetVmId:LIVE_TARGET.vmId,targetName:'ticketsim-lab',targetState:'Running',checkpointId:FIRST_WEB_TRIAL.checkpointId,checkpointName:LIVE_TARGET.checkpointName,checkpointCount:1,recoveryVmId:LIVE_TARGET.recoveryVmId,recoveryState:'Off',protectedVmId:LIVE_TARGET.protectedVmId,protectedState:'Off',backupSha256:LIVE_TARGET.backupVhdSha256,freeRamBytes:2*1024**3,cFreeBytes:13*1024**3,eFreeBytes:16*1024**3})
const draft=()=>({scenarioId:'LAB-WEB-001',vmId:LIVE_TARGET.vmId,checkpointId:FIRST_WEB_TRIAL.checkpointId,approvalId:FIRST_WEB_TRIAL.approvalId,b5Status:'PASS',firstTrialApproved:false,resetApproved:false,baselineHashes:{sshConfig:'a'.repeat(64),firewall:'b'.repeat(64)},b5Evidence:{status:'PASS',vmId:LIVE_TARGET.vmId,appliedCheckpointId:FIRST_WEB_TRIAL.checkpointId,markerAbsent:true,sshAuthenticated:true,http200Exact:true,pageSha256:LIVE_TARGET.pageSha256,backupVhdSha256:LIVE_TARGET.backupVhdSha256,noOtherVmChanged:true,finalState:'Running',sshConfigSha256:'a'.repeat(64),firewallSha256:'b'.repeat(64)}})

it('requires actual M1 identity and denied protected path access, rejecting unknown or privileged results',()=>{
  expect(assertM1Evidence(m1()).Pass).toBe(true)
  for(const key of ['HyperVMember','HyperVReadable','AdministratorMember']){
    const evidence=m1();evidence.AgentEvidence[key]=true
    expect(()=>assertM1Evidence(evidence)).toThrow('M1_PRIVILEGE_SEPARATION_FAILED')
  }
  const evidence=m1();evidence.AgentEvidence.WriteAccess['E:\\TicketSimVMs\\ticketsim-lab\\ubuntu.vhdx']='unknown'
  expect(()=>assertM1Evidence(evidence)).toThrow('M1_PROTECTED_PATH_NOT_DENIED')
})

it('blocks any prior real run, claim/reset attempt, unresolved operation or unknown state',()=>{
  const clear={realRuns:0,leases:0,pendingOperations:0,claims:0,actions:0}
  expect(()=>assertUnusedTrial(clear)).not.toThrow()
  for(const key of Object.keys(clear))expect(()=>assertUnusedTrial({...clear,[key]:1})).toThrow()
  expect(()=>assertUnusedTrial({...clear,claims:undefined})).toThrow('TRIAL_STATE_UNKNOWN')
})

it('requires exact original/checkpoint, protected states, backup and resource thresholds',()=>{
  expect(assertTrialHost(host()).checkpointId).toBe(FIRST_WEB_TRIAL.checkpointId)
  for(const patch of [{checkpointId:'wrong'},{checkpointCount:2},{recoveryState:'Running'},{protectedState:'Running'},{freeRamBytes:0},{cFreeBytes:undefined},{backupSha256:'wrong'}])expect(()=>assertTrialHost({...host(),...patch})).toThrow()
})

it('requires explicit scoped consent and M2/sudo attestations without changing the original draft',()=>{
  const baseline=draft(),options={consent:FIRST_WEB_TRIAL.consent,m2Confirmed:true,learnerSudoConfirmed:true,operator:'SONNGUYEN\\Admin',now:1_000_000}
  expect(()=>makeTrialPermit(baseline,{...options,consent:'GO'})).toThrow('EXPLICIT_M3_CONSENT_REQUIRED')
  expect(()=>makeTrialPermit(baseline,{...options,learnerSudoConfirmed:false})).toThrow('M2_AND_LEARNER_SUDO_CONFIRMATION_REQUIRED')
  const permit=makeTrialPermit(baseline,options)
  expect(permit.firstTrialApproved).toBe(true)
  expect(permit.resetApproved).toBe(true)
  expect(Date.parse(permit.trialStartBefore)).toBe(options.now+60*60_000)
  expect(permit.operatorConsent.recoveryBranches).toEqual(['submit','timeout','failed_setup'])
  expect(baseline.firstTrialApproved).toBe(false)
  expect(baseline.resetApproved).toBe(false)
})

it('reads existing SQLite state without creating claims or clearing leases',()=>{
  const dir=mkdtempSync(join(tmpdir(),'ticketsim-trial-permit-'))
  let agent,operator
  try{
    agent=new LabStore(join(dir,'runs.sqlite'));operator=new OperatorJournal(join(dir,'actions.sqlite'))
    expect(readTrialState(join(dir,'runs.sqlite'),join(dir,'actions.sqlite'))).toEqual({realRuns:0,leases:0,pendingOperations:0,claims:0,actions:0})
    operator.claim(FIRST_WEB_TRIAL.approvalId,'00000000-0000-4000-8000-000000000001')
    const observed=readTrialState(join(dir,'runs.sqlite'),join(dir,'actions.sqlite'))
    expect(observed.claims).toBe(1)
    expect(()=>assertUnusedTrial(observed)).toThrow('FIRST_TRIAL_ALREADY_ATTEMPTED')
    expect(operator.db.prepare('SELECT COUNT(*) AS n FROM approvals').get().n).toBe(1)
  }finally{
    operator?.close();agent?.close()
    if(!resolve(dir).startsWith(resolve(tmpdir())+sep))throw new Error('UNSAFE_TEST_CLEANUP_PATH')
    rmSync(dir,{recursive:true,force:true})
  }
})

function completeEvidence(){
  const id='00000000-0000-4000-8000-000000000001'
  let sequence=0
  const event=(event_type,checkId)=>({run_id:id,sequence:++sequence,event_type,metadata:{checkId,outcome:'pass'}})
  const format=(name,prefix)=>`real-${prefix}${name.replace(/[A-Z]/g,c=>`-${c.toLowerCase()}`)}-v1`
  return {runs:[{run_id:id,mode:'real',vm_ref:LIVE_TARGET.vmRef,phase:'completed',grade_status:'pass',recovery_status:'verified',evidence_note:'Learner evidence'}],
    events:[event('terminal_revoked','real-terminal-revoked-v1'),...liveChecks.grade.map(name=>event('grade_check',format(name,''))),...liveChecks.reset.map(name=>event('baseline_check',format(name,'reset-'))),event('baseline_checked','real-web-baseline-v1')],
    leases:[],approvals:[{approval_id:FIRST_WEB_TRIAL.approvalId,run_id:id,finalized_at:'2026-11-03T00:00:00Z'}],actions:[{approval_id:FIRST_WEB_TRIAL.approvalId,run_id:id,operation_id:'real-host-reset-v1',status:'pass'}],operations:[]}
}
it('reports completion only from actual per-check records, finalized journal, single reset and a released lease',()=>{
  expect(summarizeTrial(completeEvidence()).livePass).toBe(true)
  const missing=completeEvidence();missing.events=missing.events.filter(event=>event.metadata.checkId!=='real-reset-http-content-v1')
  expect(summarizeTrial(missing).livePass).toBe(false)
  const held=completeEvidence();held.leases=[{lease_state:'unknown'}]
  expect(summarizeTrial(held).technicalCompletion).toBe(false)
  const retry=completeEvidence();retry.actions.push({...retry.actions[0]})
  expect(summarizeTrial(retry).livePass).toBe(false)
})
it('never replaces a failed learner grade with the successful recovery result',()=>{
  const input=completeEvidence();input.runs[0].grade_status='fail';input.events.find(event=>event.event_type==='grade_check').metadata.outcome='fail'
  const result=summarizeTrial(input)
  expect(result.technicalCompletion).toBe(true)
  expect(result.gradeStatus).toBe('fail');expect(result.recoveryStatus).toBe('verified');expect(result.livePass).toBe(false)
})
