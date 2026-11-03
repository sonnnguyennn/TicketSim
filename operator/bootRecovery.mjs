import { createHash } from 'node:crypto'
import { LIVE_TARGET,liveChecks,checkVerdict } from '../agent/livePolicy.mjs'

export const BOOT_REQUEST='m4-original-boot-20261103-001'
export const FIREWALL_REPAIR='m4-firewall-runtime-restore-20261104-001'
export const BOOT_CHECKPOINT='e6d04330-142c-4397-8e0d-ddf5a9e69090'
export const bootEvidenceHash=bytes=>createHash('sha256').update(bytes).digest('hex')
const check=(valid,code)=>{if(!valid)throw new Error(code)}
export function assertBootContinuationEvidence({bootBytes,repair,ownerId}){
  const boot=JSON.parse(bootBytes.toString('utf8'))
  check(boot.requestId===BOOT_REQUEST&&boot.ownerId===ownerId&&boot.vmId===LIVE_TARGET.vmId&&boot.checkpointId===BOOT_CHECKPOINT,'BOOT_EVIDENCE_BINDING_MISMATCH')
  if(boot.status==='verified'&&!repair)return {repairUsed:false}
  check(boot.status==='failed-quarantined','BOOT_NOT_RECONCILABLE')
  check(repair?.requestId===FIREWALL_REPAIR&&repair.ownerId===ownerId&&repair.vmId===LIVE_TARGET.vmId&&repair.checkpointId===BOOT_CHECKPOINT&&repair.operation==='stop-firewalld-once','BOOT_REPAIR_BINDING_MISMATCH')
  check(repair.failedBootSha256===bootEvidenceHash(bootBytes),'FAILED_BOOT_EVIDENCE_CHANGED')
  check(repair.status==='verified'&&repair.sshExitCode===0,'BOOT_REPAIR_NOT_VERIFIED')
  const start=Date.parse(repair.startedAt),completed=Date.parse(repair.completedAt)
  check(Number.isFinite(start)&&Number.isFinite(completed)&&completed>=start,'BOOT_REPAIR_TIMESTAMP_INVALID')
  const proof=repair.verification
  check(proof?.verified===true&&proof.readOnly===true&&proof.livePass===true&&proof.runId==='76213ef3-ef9b-4bd2-9cb6-6c508dc2a92c'&&proof.vmId===LIVE_TARGET.vmId&&proof.checkpointId===BOOT_CHECKPOINT&&checkVerdict(proof.checks,liveChecks.preflight)==='pass','BOOT_REPAIR_BASELINE_NOT_PASS')
  return {repairUsed:true}
}
