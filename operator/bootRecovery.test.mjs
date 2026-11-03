import { expect,it } from 'vitest'
import { assertBootContinuationEvidence,bootEvidenceHash,BOOT_REQUEST,FIREWALL_REPAIR,FIREWALL_VERIFICATION,BOOT_CHECKPOINT } from './bootRecovery.mjs'
import { LIVE_TARGET,liveChecks } from '../agent/livePolicy.mjs'

function fixture(){
  const boot={requestId:BOOT_REQUEST,status:'failed-quarantined',ownerId:'owner',vmId:LIVE_TARGET.vmId,checkpointId:BOOT_CHECKPOINT}
  const bootBytes=Buffer.from(JSON.stringify(boot))
  const repair={requestId:FIREWALL_REPAIR,operation:'stop-firewalld-once',status:'verified',ownerId:'owner',vmId:LIVE_TARGET.vmId,checkpointId:BOOT_CHECKPOINT,failedBootSha256:bootEvidenceHash(bootBytes),sshExitCode:0,startedAt:'2026-11-04T00:00:00Z',completedAt:'2026-11-04T00:01:00Z',
    verification:{readOnly:true,verified:true,livePass:true,runId:'76213ef3-ef9b-4bd2-9cb6-6c508dc2a92c',vmId:LIVE_TARGET.vmId,checkpointId:BOOT_CHECKPOINT,checks:Object.fromEntries(liveChecks.preflight.map(name=>[name,'pass']))}}
  return {bootBytes,repair,ownerId:'owner'}
}
it('accepts separate verified repair without changing the failed boot bytes',()=>{
  const input=fixture(),before=Buffer.from(input.bootBytes)
  expect(assertBootContinuationEvidence(input)).toEqual({repairUsed:true})
  expect(input.bootBytes).toEqual(before)
  expect(JSON.parse(input.bootBytes).status).toBe('failed-quarantined')
  expect(()=>assertBootContinuationEvidence({...input,repair:null})).toThrow()
  expect(()=>assertBootContinuationEvidence({...input,bootBytes:Buffer.concat([input.bootBytes,Buffer.from(' ')])})).toThrow('FAILED_BOOT_EVIDENCE_CHANGED')
})
it('rejects partial, ambiguous, cross-owner or changed-scope repair and any missing baseline check',()=>{
  for(const patch of [{status:'reserved'},{status:'ssh_returned'},{status:'failed-quarantined'},{sshExitCode:255},{ownerId:'foreign'},{vmId:LIVE_TARGET.protectedVmId},{checkpointId:'foreign'},{operation:'reset'},{failedBootSha256:'0'.repeat(64)},{completedAt:'2025-01-01T00:00:00Z'}]){
    const input=fixture();expect(()=>assertBootContinuationEvidence({...input,repair:{...input.repair,...patch}})).toThrow()
  }
  for(const name of liveChecks.preflight){
    const input=fixture();input.repair.verification.checks[name]='unknown'
    expect(()=>assertBootContinuationEvidence(input)).toThrow('BOOT_REPAIR_BASELINE_NOT_PASS')
  }
  for(const patch of [{readOnly:false},{livePass:false},{verified:false},{runId:'foreign'},{vmId:LIVE_TARGET.protectedVmId}]){
    const input=fixture();Object.assign(input.repair.verification,patch)
    expect(()=>assertBootContinuationEvidence(input)).toThrow('BOOT_REPAIR_BASELINE_NOT_PASS')
  }
})
it('preserves the successful original boot path but refuses wrong bindings or extraneous failed repair',()=>{
  const input=fixture(),boot=JSON.parse(input.bootBytes)
  boot.status='verified';const bootBytes=Buffer.from(JSON.stringify(boot))
  expect(assertBootContinuationEvidence({bootBytes,ownerId:'owner'})).toEqual({repairUsed:false})
  expect(()=>assertBootContinuationEvidence({bootBytes,ownerId:'foreign'})).toThrow('BOOT_EVIDENCE_BINDING_MISMATCH')
  expect(()=>assertBootContinuationEvidence({...input,bootBytes})).toThrow('BOOT_NOT_RECONCILABLE')
})

function reconciledFixture(){
  const input=fixture(),proof=structuredClone(input.repair.verification)
  input.repair.status='failed-quarantined';input.repair.failedStage='ssh_returned'
  input.repair.verification.verified=false;input.repair.verification.checks.sshAuthentication='unknown'
  const repairBytes=Buffer.from(JSON.stringify(input.repair))
  return {...input,repairBytes,reconciliation:{requestId:FIREWALL_VERIFICATION,status:'verified',readOnly:true,ownerId:input.ownerId,vmId:LIVE_TARGET.vmId,checkpointId:BOOT_CHECKPOINT,repairSha256:bootEvidenceHash(repairBytes),failedBootSha256:bootEvidenceHash(input.bootBytes),verification:proof,completedAt:'2026-11-04T00:02:00Z'}}
}
it('reconciles verification-only failure with separate full PASS evidence and leaves both failures intact',()=>{
  const input=reconciledFixture(),before=[Buffer.from(input.bootBytes),Buffer.from(input.repairBytes)]
  expect(assertBootContinuationEvidence(input)).toEqual({repairUsed:true})
  expect([input.bootBytes,input.repairBytes]).toEqual(before)
  expect(JSON.parse(input.repairBytes).status).toBe('failed-quarantined')
  expect(()=>assertBootContinuationEvidence({...input,reconciliation:null})).toThrow('BOOT_RECONCILIATION_BINDING_MISMATCH')
  expect(()=>assertBootContinuationEvidence({...input,repairBytes:Buffer.concat([input.repairBytes,Buffer.from(' ')])})).toThrow('FAILED_REPAIR_EVIDENCE_CHANGED')
})
it('cannot reconcile an unknown SSH mutation outcome, wrong evidence binding or incomplete fresh baseline',()=>{
  for(const patch of [{sshExitCode:255},{failedStage:'reserved'},{status:'ssh_returned'}]){
    const input=reconciledFixture(),repairBytes=Buffer.from(JSON.stringify({...input.repair,...patch}))
    input.reconciliation.repairSha256=bootEvidenceHash(repairBytes)
    expect(()=>assertBootContinuationEvidence({...input,repairBytes})).toThrow()
  }
  for(const patch of [{ownerId:'foreign'},{readOnly:false},{status:'pending'},{repairSha256:'0'.repeat(64)},{failedBootSha256:'0'.repeat(64)},{checkpointId:'foreign'}]){
    const input=reconciledFixture();Object.assign(input.reconciliation,patch)
    expect(()=>assertBootContinuationEvidence(input)).toThrow()
  }
  for(const name of liveChecks.preflight){
    const input=reconciledFixture();input.reconciliation.verification.checks[name]='unknown'
    expect(()=>assertBootContinuationEvidence(input)).toThrow('BOOT_REPAIR_BASELINE_NOT_PASS')
  }
})
