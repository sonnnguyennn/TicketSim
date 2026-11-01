import { LabError } from './errors.mjs'

export const LIVE_TARGET = Object.freeze({
  vmRef: 'hyperv:2b9c2170-9a23-4d08-b82e-29929afa4c10',
  vmId: '2b9c2170-9a23-4d08-b82e-29929afa4c10',
  checkpointName: 'ticketsim-lab-b5-clean-baseline-v1',
  recoveryVmId: '463dddf4-6e47-47b7-a39f-5b5d7ef84df0',
  protectedVmId: '546953dc-48e4-4080-839d-27ad5552ac7d',
  backupVhdSha256: '3E410A9894FD5936A84B9625295081C5C2D3278D57C9D0BA8EBDD228661ED535',
  pageSha256: '1f9236c846970eaf058b495c502de066488374dc530d54f17c5924603fe7a786',
  nginxConfigSha256: '4869cddce1030ceffb99bf88b1a64a0ec2b5d51c0c2377958f48533bae320522',
  netplanSha256: '2c1b7b7be71e9bc2b6b43723f847e1b14c4d03dc35f580f63d475176a08d7014',
  cloudInitSha256: 'd203e937531b82a5b5035e3149dddd48963f790f5fa7c95e0b4f3d64c1486abf',
  sshFingerprint: 'SHA256:8LJ5bycBjgnfgRXp5tFh1jV/BGrfvb41rQQnzfbVi3U',
  managementIp: '10.77.77.3',
  controller: 'hyperv', disposable: true,
})

const requiredPreflight = Object.freeze(['vmIdentity','protectedIdentity','recoveryStopped','checkpointIdentity','b5Proof','backupHash','hostRam','diskC','diskE','sshAuthentication','sshHostKey','sshConfig','nginxConfig','nginxService','httpStatus','httpContent','pageHash','configHash','netplanHash','cloudInitHash','sshConfigHash','firewallHash','managementRoute'])
const requiredGrade = Object.freeze(['sshConfig','nginxConfig','nginxService','httpStatus','httpContent','sshAuthentication','sshHostKey','configHash','netplanHash','cloudInitHash','sshConfigHash','firewallHash','managementRoute'])
const requiredFault = Object.freeze(['sshAuthentication','sshHostKey','nginxStopped','httpUnavailable','managementAvailable'])
const requiredReset = Object.freeze(['vmIdentity','checkpointIdentity','backupHash','sshAuthentication','sshHostKey','sshConfig','nginxConfig','nginxService','httpStatus','httpContent','pageHash','configHash','netplanHash','cloudInitHash','sshConfigHash','firewallHash','managementRoute','finalState','hostRam','diskC','diskE'])
export const liveChecks = Object.freeze({ preflight: requiredPreflight, fault: requiredFault, grade: requiredGrade, reset: requiredReset })

export function checkVerdict(checks, names) {
  if (!checks || typeof checks !== 'object' || Array.isArray(checks)) return 'unknown'
  const values = names.map(name => checks[name])
  if (values.some(value => !['pass','fail','unknown'].includes(value))) return 'unknown'
  if (values.includes('fail')) return 'fail'
  return values.includes('unknown') ? 'unknown' : 'pass'
}

export function assertLiveApproval(approval) {
  if (!approval || approval.scenarioId !== 'LAB-WEB-001' || approval.vmId?.toLowerCase() !== LIVE_TARGET.vmId || !/^[0-9a-f-]{36}$/i.test(approval.checkpointId ?? '') || approval.checkpointId === LIVE_TARGET.protectedVmId || approval.b5Status !== 'PASS' || approval.firstTrialApproved !== true || approval.resetApproved !== true || !/^[A-Za-z0-9-]{8,64}$/.test(approval.approvalId ?? '') || !/^[a-f0-9]{64}$/i.test(approval.baselineHashes?.sshConfig ?? '') || !/^[a-f0-9]{64}$/i.test(approval.baselineHashes?.firewall ?? '')) throw new LabError('LIVE_APPROVAL_MISSING', 403)
  const proof = approval.b5Evidence
  const validProof = proof?.status === 'PASS' && proof.vmId?.toLowerCase() === LIVE_TARGET.vmId && proof.appliedCheckpointId?.toLowerCase() === approval.checkpointId.toLowerCase() && proof.markerAbsent === true && proof.sshAuthenticated === true && proof.http200Exact === true && proof.pageSha256?.toLowerCase() === LIVE_TARGET.pageSha256 && proof.backupVhdSha256?.toUpperCase() === LIVE_TARGET.backupVhdSha256 && proof.noOtherVmChanged === true && proof.finalState === 'Running' && proof.sshConfigSha256?.toLowerCase() === approval.baselineHashes.sshConfig.toLowerCase() && proof.firewallSha256?.toLowerCase() === approval.baselineHashes.firewall.toLowerCase()
  if (!validProof) throw new LabError('B5_PROOF_INVALID', 403)
  return approval
}

export function assertLiveObservation(observation, approval) {
  if (!observation || observation.vmId?.toLowerCase() !== LIVE_TARGET.vmId || observation.checkpointId?.toLowerCase() !== approval.checkpointId.toLowerCase() || observation.recoveryVmId?.toLowerCase() !== LIVE_TARGET.recoveryVmId || observation.protectedVmId?.toLowerCase() !== LIVE_TARGET.protectedVmId) throw new LabError('LIVE_IDENTITY_MISMATCH', 403)
  return observation
}
