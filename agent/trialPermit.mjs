import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { LIVE_TARGET, assertLiveApproval } from './livePolicy.mjs'
import { runHostAction } from '../operator/server.mjs'

export const FIRST_WEB_TRIAL = Object.freeze({
  approvalId:'lab-web-001-first-trial-20261103-001',
  checkpointId:'e6d04330-142c-4397-8e0d-ddf5a9e69090',
  consent:'APPROVE M3 lab-web-001-first-trial-20261103-001',
})
const state='C:/ProgramData/TicketSimPilot'
const json=filename=>JSON.parse(readFileSync(filename,'utf8').trim())
const requireCheck=(valid,code)=>{if(!valid)throw new Error(code)}

export function assertM1Evidence(m1) {
  const a=m1?.AgentEvidence,r=m1?.Runtime,w=a?.WriteAccess
  requireCheck(m1?.Pass===true&&m1.TlsVerified===true&&a?.Pass===true,'M1_EVIDENCE_NOT_PASS')
  requireCheck(/\\TicketSimAgent$/i.test(m1.AgentPrincipal??'')&&a.Principal?.toLowerCase()===m1.AgentPrincipal.toLowerCase()&&r?.principal?.toLowerCase()===m1.AgentPrincipal.toLowerCase(),'M1_PRINCIPAL_MISMATCH')
  requireCheck(a.AdministratorMember===false&&a.HyperVMember===false&&a.HyperVReadable===false&&r.privileged===false&&r.hypervReadable===false,'M1_PRIVILEGE_SEPARATION_FAILED')
  requireCheck(w?.['C:\\ProgramData\\TicketSimPilot\\agent']===true,'M1_AGENT_STATE_NOT_WRITABLE')
  for(const path of ['C:\\Program Files\\TicketSimPilot','C:\\ProgramData\\TicketSimPilot\\operator','E:\\TicketSimVMs\\ticketsim-lab\\ubuntu.vhdx','C:\\TicketSimBackups\\baseline-2b9c2170-20261029\\ticketsim-lab\\Virtual Hard Disks\\ubuntu.vhdx'])requireCheck(w?.[path]===false,'M1_PROTECTED_PATH_NOT_DENIED')
  requireCheck(m1.OperatorPrincipal?.toLowerCase()!==m1.AgentPrincipal.toLowerCase(),'M1_OPERATOR_NOT_SEPARATE')
  return m1
}

export function assertUnusedTrial({realRuns,leases,pendingOperations,claims,actions}) {
  for(const count of [realRuns,leases,pendingOperations,claims,actions])requireCheck(Number.isInteger(count)&&count>=0,'TRIAL_STATE_UNKNOWN')
  requireCheck(leases===0&&pendingOperations===0,'TRIAL_LEASE_OR_OPERATION_HELD')
  requireCheck(realRuns===0&&claims===0&&actions===0,'FIRST_TRIAL_ALREADY_ATTEMPTED')
}

export function readTrialState(agentPath,operatorPath) {
  requireCheck(existsSync(agentPath)&&existsSync(operatorPath),'TRIAL_DATABASE_MISSING')
  const agent=new DatabaseSync(agentPath,{readOnly:true})
  let operator
  try {
    agent.exec('PRAGMA query_only=ON')
    operator=new DatabaseSync(operatorPath,{readOnly:true});operator.exec('PRAGMA query_only=ON')
    return {
      realRuns:agent.prepare("SELECT COUNT(*) AS n FROM lab_runs WHERE mode='real'").get().n,
      leases:agent.prepare('SELECT COUNT(*) AS n FROM vm_leases').get().n,
      pendingOperations:agent.prepare("SELECT COUNT(*) AS n FROM web_operations WHERE status IN ('pending','unknown')").get().n,
      claims:operator.prepare('SELECT COUNT(*) AS n FROM approvals').get().n,
      actions:operator.prepare('SELECT COUNT(*) AS n FROM actions').get().n,
    }
  }finally{operator?.close();agent.close()}
}

export function assertTrialHost(host) {
  requireCheck(host?.targetVmId?.toLowerCase()===LIVE_TARGET.vmId&&host.targetName==='ticketsim-lab'&&host.targetState==='Running','TRIAL_ORIGINAL_MISMATCH')
  requireCheck(host.checkpointId?.toLowerCase()===FIRST_WEB_TRIAL.checkpointId&&host.checkpointName===LIVE_TARGET.checkpointName&&host.checkpointCount===1,'TRIAL_CHECKPOINT_MISMATCH')
  requireCheck(host.recoveryVmId?.toLowerCase()===LIVE_TARGET.recoveryVmId&&host.recoveryState==='Off'&&host.protectedVmId?.toLowerCase()===LIVE_TARGET.protectedVmId&&host.protectedState==='Off','TRIAL_OTHER_VM_STATE_MISMATCH')
  requireCheck(host.backupSha256?.toUpperCase()===LIVE_TARGET.backupVhdSha256,'TRIAL_BACKUP_MISMATCH')
  requireCheck(Number.isFinite(host.freeRamBytes)&&host.freeRamBytes>=1024**3&&Number.isFinite(host.cFreeBytes)&&host.cFreeBytes>=12*1024**3&&Number.isFinite(host.eFreeBytes)&&host.eFreeBytes>=15*1024**3,'TRIAL_RESOURCES_FAILED')
  return host
}

export function makeTrialPermit(draft,{consent,m2Confirmed,learnerSudoConfirmed,operator,now=Date.now()}={}) {
  requireCheck(consent===FIRST_WEB_TRIAL.consent,'EXPLICIT_M3_CONSENT_REQUIRED')
  requireCheck(m2Confirmed===true&&learnerSudoConfirmed===true,'M2_AND_LEARNER_SUDO_CONFIRMATION_REQUIRED')
  requireCheck(typeof operator==='string'&&operator.length>2&&!/\\TicketSimAgent$/i.test(operator),'OPERATOR_IDENTITY_REQUIRED')
  requireCheck(draft?.approvalId===FIRST_WEB_TRIAL.approvalId&&draft.checkpointId===FIRST_WEB_TRIAL.checkpointId,'FIRST_TRIAL_BINDING_MISMATCH')
  requireCheck(draft.firstTrialApproved===false&&draft.resetApproved===false,'DRAFT_MUST_REMAIN_UNARMED')
  const permit={...draft,firstTrialApproved:true,resetApproved:true,
    trialStartBefore:new Date(now+60*60_000).toISOString(),
    operatorConsent:{principal:operator,approvedAt:new Date(now).toISOString(),oneTrialOnly:true,m2Confirmed:true,learnerSudoConfirmed:true,
      faultActionId:'real-web-stop-nginx-v1',recoveryActionId:'real-host-reset-v1',recoveryBranches:['submit','timeout','failed_setup']}}
  assertLiveApproval(permit)
  return permit
}

export async function armFirstTrial() {
  const counts=readTrialState(`${state}/agent/runs.sqlite`,`${state}/operator/actions.sqlite`)
  assertUnusedTrial(counts)
  requireCheck(!existsSync('E:/TicketSimOperatorState/b5/exclusive-lease'),'B5_LEASE_HELD')
  const m1=assertM1Evidence(json(`${state}/operator/m1-evidence.json`))
  const host=assertTrialHost(await runHostAction('real-host-inspect-v1',FIRST_WEB_TRIAL.checkpointId))
  const permit=makeTrialPermit(json(`${state}/operator/approval.DRAFT.json`),{
    consent:process.env.TICKETSIM_TRIAL_CONSENT,m2Confirmed:process.env.TICKETSIM_M2_CONFIRMED==='1',
    learnerSudoConfirmed:process.env.TICKETSIM_SUDO_CONFIRMED==='1',operator:process.env.TICKETSIM_TRIAL_OPERATOR})
  const admissionPath=`${state}/operator/first-web-trial-admission.json`
  if(existsSync(admissionPath)){
    const prior=json(admissionPath),protectedPermit=json(`${state}/operator/approval.json`),publicPermit=json(`${state}/shared/approval.json`)
    requireCheck(prior.approvalId===FIRST_WEB_TRIAL.approvalId&&prior.vmId===LIVE_TARGET.vmId&&prior.checkpointId===FIRST_WEB_TRIAL.checkpointId,'ADMISSION_BINDING_MISMATCH')
    assertLiveApproval(protectedPermit)
    requireCheck(protectedPermit.approvalId===FIRST_WEB_TRIAL.approvalId&&protectedPermit.checkpointId===FIRST_WEB_TRIAL.checkpointId&&JSON.stringify(protectedPermit)===JSON.stringify(publicPermit),'ADMISSION_PERMIT_INCOMPLETE')
    requireCheck(Date.parse(protectedPermit.trialStartBefore)>Date.now(),'APPROVAL_START_WINDOW_EXPIRED')
    return {approvalId:prior.approvalId,admission:'existing_unused_permit',trialStartBefore:protectedPermit.trialStartBefore,counts,host}
  }
  requireCheck(!existsSync(`${state}/operator/approval.json`)&&!existsSync(`${state}/shared/approval.json`),'UNEXPECTED_EXISTING_TRIAL_PERMIT')
  const admission={approvalId:permit.approvalId,vmId:LIVE_TARGET.vmId,checkpointId:permit.checkpointId,
    operatorConsent:permit.operatorConsent,trialStartBefore:permit.trialStartBefore,m1CheckedAt:m1.CheckedAt,
    m2Evidence:'Operator/user confirmed actual browser preflight, fixed guest PTY, reconnect/refresh and HTTP baseline; supplied screenshots; sudo -l: (ALL : ALL) ALL.',counts,host}
  // Never overwrite or roll back a partial admission. A crash leaves evidence for operator review.
  writeFileSync(admissionPath,JSON.stringify(admission,null,2),{flag:'wx'})
  writeFileSync(`${state}/operator/approval.json`,JSON.stringify(permit,null,2),{flag:'wx'})
  writeFileSync(`${state}/shared/approval.json`,JSON.stringify(permit,null,2),{flag:'wx'})
  return {approvalId:permit.approvalId,admission:'armed_not_claimed',trialStartBefore:permit.trialStartBefore,counts,host}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  requireCheck(process.argv[2]==='arm','UNKNOWN_TRIAL_OPERATION')
  armFirstTrial().then(result=>process.stdout.write(`${JSON.stringify(result)}\n`)).catch(error=>{
    process.stderr.write(`${/^[A-Z0-9_]{1,100}$/.test(error.message)?error.message:'TRIAL_ARMING_FAILED'}\n`);process.exitCode=1
  })
}
