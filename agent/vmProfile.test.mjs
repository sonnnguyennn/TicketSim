import { describe, expect, it } from 'vitest'
import { assertRealMutationAllowed, validateVmProfile, verifyVmEndpoint } from './vmProfile.mjs'
import { lab1ReferenceProfile, mockWebProfile } from './vmProfiles.mjs'
import { mockWebObservation } from './mockVmController.mjs'

const verify = (observation, profile = mockWebProfile) => verifyVmEndpoint(profile, observation, { scenarioId: 'LAB-WEB-001' })
const altered = (patch = {}) => ({ ...mockWebObservation(), ...patch })

describe('server-owned dual-NIC VM profile', () => {
  it('records lab1 management endpoint but leaves controller, switch, host key and recovery unknown', () => {
    expect(validateVmProfile(lab1ReferenceProfile)).toBe(lab1ReferenceProfile)
    expect(lab1ReferenceProfile.network.management).toMatchObject({ interfaceName: 'eth1', ipv4Address: '10.77.77.2', prefixLength: 24, expectedMac: '52:54:00:9b:86:93', hostIpv4Address: '10.77.77.1' })
    expect(lab1ReferenceProfile.network.dynamic).toMatchObject({ interfaceName: 'eth0', addressPolicy: 'dynamic' })
    const observation = altered({
      vmRef: 'lab1', hypervVmId: lab1ReferenceProfile.vm.hypervVmId, controller: 'multipass', disposable: false,
      management: { ...mockWebObservation().management, interfaceName: 'eth1', ipv4Address: '10.77.77.2', mac: '52:54:00:9b:86:93', switchId: null, switchType: 'unknown' },
      dynamic: { interfaceName: 'eth0', ipv4Address: '172.22.122.192' },
      addressInventoryComplete: false, addressOwners: null, sshHostKeyFingerprint: null,
    })
    const result = verify(observation, lab1ReferenceProfile)
    expect(result.checks.managementIp).toBe('pass')
    expect(result.checks.managementMac).toBe('pass')
    expect(result.checks.lifecycleController).toBe('unknown')
    expect(result.checks.switchMapping).toBe('unknown')
    expect(result.checks.sshHostKey).toBe('unknown')
    expect(result.checks.ipUniqueness).toBe('unknown')
    expect(result.checks.disposableApproval).toBe('fail')
    expect(result.readyForMockRun).toBe(false)
    expect(result.readyForRealRun).toBe(false)
  })

  it('accepts only the complete synthetic endpoint for a mock run', () => {
    expect(validateVmProfile(mockWebProfile)).toBe(mockWebProfile)
    const result = verify(mockWebObservation())
    expect(result.verifiedManagementEndpoint).toBe(true)
    expect(result.readyForMockRun).toBe(true)
    expect(result.readyForRealRun).toBe(false)
  })

  it.each([
    ['wrong VM identity', { hypervVmId: '00000000-0000-4000-8000-000000000099' }, 'vmIdentity'],
    ['wrong lifecycle controller', { controller: 'multipass' }, 'lifecycleController'],
    ['SSH unavailable', { tcp22Open: false }, 'sshPort'],
    ['SSH authentication failed', { sshAuthenticated: false }, 'sshAuthentication'],
    ['recovery unverified', { recoveryVerified: false }, 'recovery'],
    ['stale observation', { observedAt: '2020-01-01T00:00:00Z' }, 'freshness'],
  ])('fails closed for %s', (_label, patch, check) => {
    const result = verify(altered(patch))
    expect(result.checks[check]).toBe('fail')
    expect(result.readyForMockRun).toBe(false)
  })

  it('rejects a wrong management MAC or interface', () => {
    const observation = mockWebObservation()
    expect(verify(altered({ management: { ...observation.management, mac: '02:00:00:00:00:99' } })).checks.managementMac).toBe('fail')
    expect(verify(altered({ management: { ...observation.management, interfaceName: 'eth9' } })).checks.managementInterface).toBe('fail')
  })

  it('rejects wrong static IP, duplicate IP and switch mapping', () => {
    const observation = mockWebObservation()
    expect(verify(altered({ management: { ...observation.management, ipv4Address: '192.0.2.99' } })).checks.managementIp).toBe('fail')
    expect(verify(altered({ addressOwners: [...observation.addressOwners, { ipv4Address: '192.0.2.2', hypervVmId: '00000000-0000-4000-8000-000000000099' }] })).checks.ipUniqueness).toBe('fail')
    expect(verify(altered({ management: { ...observation.management, switchId: 'wrong-switch' } })).checks.switchMapping).toBe('fail')
  })

  it('ignores eth0 address rotation while keeping eth1 stable', () => {
    const result = verify(altered({ dynamic: { interfaceName: 'eth0', ipv4Address: '198.51.100.99' } }))
    expect(result.checks.dynamicInterface).toBe('pass')
    expect(result.readyForMockRun).toBe(true)
  })

  it('blocks a disconnected management NIC and missing connectivity evidence', () => {
    const observation = mockWebObservation()
    expect(verify(altered({ management: { ...observation.management, linkUp: false } })).checks.managementInterface).toBe('fail')
    const result = verify(null)
    expect(result.checks.sshPort).toBe('unknown')
    expect(result.readyForMockRun).toBe(false)
  })

  it('rejects malformed addresses, overlapping interfaces and mismatched privilege policy', () => {
    expect(() => validateVmProfile({ ...mockWebProfile, network: { ...mockWebProfile.network, management: { ...mockWebProfile.network.management, ipv4Address: '172.26.296.27' } } })).toThrow('INVALID_VM_PROFILE_IP')
    expect(() => validateVmProfile({ ...mockWebProfile, network: { ...mockWebProfile.network, dynamic: { ...mockWebProfile.network.dynamic, interfaceName: 'eth1' } } })).toThrow('INVALID_VM_PROFILE_NETWORK')
    expect(() => validateVmProfile({ ...mockWebProfile, authorization: { ...mockWebProfile.authorization, privilegePolicy: 'none' } })).toThrow('INVALID_PRIVILEGE_POLICY')
  })

  it('rejects fabricated profile approval and all real VM mutations', () => {
    expect(() => validateVmProfile({ ...lab1ReferenceProfile, authorization: { ...lab1ReferenceProfile.authorization, disposableApproved: true } })).toThrow('PROTECTED_VM')
    expect(() => assertRealMutationAllowed(lab1ReferenceProfile)).toThrow('PROTECTED_VM')
    expect(() => assertRealMutationAllowed(mockWebProfile)).toThrow('REAL_ACTIONS_DISABLED')
  })
})
