// Append separate verification evidence only. No guest mutation or old record edit.
import { readFileSync,existsSync,openSync,writeFileSync,fsyncSync,closeSync } from 'node:fs'
import { readActiveUpgrade } from '../../operator/upgradeRecovery.mjs'
import { assertBootContinuationEvidence,bootEvidenceHash,BOOT_REQUEST,FIREWALL_REPAIR,FIREWALL_VERIFICATION,BOOT_CHECKPOINT } from '../../operator/bootRecovery.mjs'
import { verifyApprovedBoot } from './verify-approved-boot.mjs'
import { safeUpgradeFailure } from '../../operator/upgradeDiagnostics.mjs'

let stage='read_failed_evidence'
async function main(){
  const state='C:/ProgramData/TicketSimPilot/operator',output=`${state}/${FIREWALL_VERIFICATION}.json`
  if(existsSync(output))throw new Error('VERIFICATION_RECORD_EXISTS_DO_NOT_OVERWRITE')
  const {record}=readActiveUpgrade('C:/ProgramData/TicketSimPilot')
  if(record.phase!=='retired')throw new Error('RETIRED_RECORD_REQUIRED')
  const bootFile=`${state}/${BOOT_REQUEST}.json`,repairFile=`${state}/${FIREWALL_REPAIR}.json`
  const bootBytes=readFileSync(bootFile),repairBytes=readFileSync(repairFile),repair=JSON.parse(repairBytes.toString('utf8'))
  if(repair.status!=='failed-quarantined'||repair.sshExitCode!==0||repair.failedStage!=='ssh_returned')throw new Error('FAILED_REPAIR_NOT_RECONCILABLE')
  stage='fresh_operator_baseline'
  const verification=await verifyApprovedBoot()
  if(!verification.verified){process.stdout.write(`${JSON.stringify({recorded:false,stage,verification})}\n`);process.exitCode=1;return}
  const reconciliation={requestId:FIREWALL_VERIFICATION,status:'verified',readOnly:true,ownerId:record.ownerId,operatorPrincipal:record.operatorPrincipal,vmId:'2b9c2170-9a23-4d08-b82e-29929afa4c10',checkpointId:BOOT_CHECKPOINT,
    repairSha256:bootEvidenceHash(repairBytes),failedBootSha256:bootEvidenceHash(bootBytes),verification,completedAt:new Date().toISOString()}
  stage='validate_reconciliation'
  assertBootContinuationEvidence({bootBytes,repairBytes,reconciliation,ownerId:record.ownerId})
  if(bootEvidenceHash(readFileSync(bootFile))!==reconciliation.failedBootSha256||bootEvidenceHash(readFileSync(repairFile))!==reconciliation.repairSha256)throw new Error('FAILED_EVIDENCE_CHANGED_DURING_VERIFICATION')
  stage='record_separate_evidence'
  const fd=openSync(output,'wx',0o600)
  try{writeFileSync(fd,JSON.stringify(reconciliation,null,2));fsyncSync(fd)}finally{closeSync(fd)}
  process.stdout.write(`${JSON.stringify({recorded:true,readOnlyProbes:true,failedRecordsUnchanged:true,maintenanceGateRetained:true,verification},null,2)}\n`)
}
main().catch(error=>{process.stderr.write(`${JSON.stringify({recorded:false,stage,failure:safeUpgradeFailure(error)})}\n`);process.exitCode=1})
