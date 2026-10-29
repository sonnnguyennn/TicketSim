import { readFileSync } from 'node:fs'
import { isIP } from 'node:net'
import Ajv from 'ajv'
import { LabError } from './errors.mjs'

export const protectedLab1Id = '546953dc-48e4-4080-839d-27ad5552ac7d'
const schema = JSON.parse(readFileSync(new URL('./vm-profile.schema.json', import.meta.url), 'utf8'))
const validateSchema = new Ajv({ allErrors: true }).compile(schema)
const mac = value => typeof value === 'string' ? value.toLowerCase().replaceAll('-', ':') : null
const signal = (condition, known = true) => !known ? 'unknown' : condition ? 'pass' : 'fail'

export function validateVmProfile(profile) {
  if (!validateSchema(profile)) throw new LabError('INVALID_VM_PROFILE', 400)
  const management = profile.network.management
  const dynamic = profile.network.dynamic
  if (isIP(management.ipv4Address) !== 4 || management.hostIpv4Address !== null && isIP(management.hostIpv4Address) !== 4 || dynamic.lastObservedIpv4 !== null && isIP(dynamic.lastObservedIpv4) !== 4) throw new LabError('INVALID_VM_PROFILE_IP', 400)
  if (management.hostIpv4Address === management.ipv4Address || management.interfaceName === dynamic.interfaceName) throw new LabError('INVALID_VM_PROFILE_NETWORK', 400)
  if (management.switchId === null && management.switchType !== 'unknown' || management.switchId !== null && management.switchType === 'unknown') throw new LabError('INVALID_VM_PROFILE_SWITCH', 400)
  if (profile.mode === 'mock-only' && !profile.vm.vmRef.startsWith('mock:') || profile.mode === 'reference-only' && profile.vm.vmRef.startsWith('mock:')) throw new LabError('INVALID_VM_PROFILE_MODE', 400)
  if (profile.vm.hypervVmId.toLowerCase() === protectedLab1Id && profile.authorization.disposableApproved) throw new LabError('PROTECTED_VM', 403)
  if (profile.mode === 'reference-only' && profile.authorization.disposableApproved) throw new LabError('REFERENCE_VM_NOT_DISPOSABLE', 400)
  if (profile.authorization.privilegePolicy !== (profile.mode === 'mock-only' ? 'mock-only' : 'none')) throw new LabError('INVALID_PRIVILEGE_POLICY', 400)
  if (profile.authorization.disposableApproved && (!profile.authorization.baselineId || !profile.authorization.recoveryProofId || !profile.authorization.allowedScenarioIds.length)) throw new LabError('MISSING_RECOVERY_POLICY', 400)
  return profile
}

/** Pure evaluator; observations must come from a trusted host/guest collector in a later phase. */
export function verifyVmEndpoint(profile, observation, { scenarioId, now = Date.now(), maxAgeMs = 5 * 60_000 } = {}) {
  validateVmProfile(profile)
  const management = profile.network.management
  const checks = {
    vmIdentity: signal(observation?.hypervVmId?.toLowerCase() === profile.vm.hypervVmId.toLowerCase(), !!observation?.hypervVmId),
    vmRef: signal(observation?.vmRef === profile.vm.vmRef, !!observation?.vmRef),
    lifecycleController: signal(observation?.controller === profile.vm.controller, profile.vm.controller !== 'unconfirmed' && !!observation?.controller),
    powerState: signal(observation?.powerState === 'running', !!observation?.powerState),
    managementInterface: signal(observation?.management?.interfaceName === management.interfaceName && observation?.management?.linkUp === true, !!observation?.management?.interfaceName && typeof observation?.management?.linkUp === 'boolean'),
    managementMac: signal(mac(observation?.management?.mac) === mac(management.expectedMac), !!observation?.management?.mac),
    managementIp: signal(observation?.management?.ipv4Address === management.ipv4Address && observation?.management?.prefixLength === management.prefixLength, !!observation?.management?.ipv4Address && Number.isInteger(observation?.management?.prefixLength)),
    switchMapping: signal(observation?.management?.switchId === management.switchId && observation?.management?.switchType === management.switchType, !!management.switchId && management.switchType !== 'unknown' && !!observation?.management?.switchId && !!observation?.management?.switchType),
    staticConfigured: signal(observation?.management?.staticConfigured === true, typeof observation?.management?.staticConfigured === 'boolean'),
    sshPort: signal(observation?.tcp22Open === true, typeof observation?.tcp22Open === 'boolean'),
    sshHostKey: signal(observation?.sshHostKeyFingerprint === management.sshHostKeyFingerprint, !!management.sshHostKeyFingerprint && !!observation?.sshHostKeyFingerprint),
    sshAuthentication: signal(observation?.sshAuthenticated === true, typeof observation?.sshAuthenticated === 'boolean'),
    disposableIdentity: signal(observation?.disposable === true, typeof observation?.disposable === 'boolean'),
    disposableApproval: signal(profile.authorization.disposableApproved === true),
    scenarioApproval: signal(profile.authorization.allowedScenarioIds.includes(scenarioId), typeof scenarioId === 'string'),
    baseline: signal(observation?.baselineVerified === true, !!profile.authorization.baselineId && typeof observation?.baselineVerified === 'boolean'),
    recovery: signal(observation?.recoveryVerified === true, !!profile.authorization.recoveryProofId && typeof observation?.recoveryVerified === 'boolean'),
    freshness: signal(Number.isFinite(Date.parse(observation?.observedAt)) && now - Date.parse(observation.observedAt) >= -30_000 && now - Date.parse(observation.observedAt) <= maxAgeMs, !!observation?.observedAt),
    dynamicInterface: signal(observation?.dynamic?.interfaceName === profile.network.dynamic.interfaceName, !!observation?.dynamic?.interfaceName),
  }
  const owners = observation?.addressOwners
  checks.ipUniqueness = Array.isArray(owners) && observation?.addressInventoryComplete === true
    ? signal(owners.some(owner => owner.ipv4Address === management.ipv4Address && owner.hypervVmId?.toLowerCase() === profile.vm.hypervVmId.toLowerCase()) && !owners.some(owner => owner.ipv4Address === management.ipv4Address && owner.hypervVmId?.toLowerCase() !== profile.vm.hypervVmId.toLowerCase()))
    : 'unknown'
  const readyForMockRun = profile.mode === 'mock-only' && Object.values(checks).every(status => status === 'pass')
  const endpointChecks = ['vmIdentity', 'vmRef', 'lifecycleController', 'managementInterface', 'managementMac', 'managementIp', 'switchMapping', 'ipUniqueness', 'staticConfigured', 'sshPort', 'sshHostKey', 'sshAuthentication', 'freshness']
  return { checks, readyForMockRun, readyForRealRun: false, verifiedManagementEndpoint: endpointChecks.every(id => checks[id] === 'pass') }
}

/** No real lifecycle controller exists in Phase 1B-0, even for an approved-looking profile. */
export function assertRealMutationAllowed(profile) {
  if (profile?.vm?.hypervVmId?.toLowerCase() === protectedLab1Id || profile?.vm?.name === 'lab1') throw new LabError('PROTECTED_VM', 403)
  throw new LabError('REAL_ACTIONS_DISABLED', 403)
}
