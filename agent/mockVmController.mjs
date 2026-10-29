import { LabError } from './errors.mjs'
import { mockWebProfile } from './vmProfiles.mjs'

export function mockWebObservation() {
  const profile = mockWebProfile
  return {
    vmRef: profile.vm.vmRef, hypervVmId: profile.vm.hypervVmId, controller: profile.vm.controller,
    disposable: true, powerState: 'running', simulated: true, observedAt: new Date().toISOString(),
    management: { interfaceName: 'eth1', ipv4Address: profile.network.management.ipv4Address, prefixLength: 24, mac: profile.network.management.expectedMac, switchId: profile.network.management.switchId, switchType: 'internal', linkUp: true, staticConfigured: true },
    dynamic: { interfaceName: 'eth0', ipv4Address: profile.network.dynamic.lastObservedIpv4 },
    addressInventoryComplete: true, addressOwners: [{ ipv4Address: profile.network.management.ipv4Address, hypervVmId: profile.vm.hypervVmId }],
    tcp22Open: true, sshHostKeyFingerprint: profile.network.management.sshHostKeyFingerprint,
    sshAuthenticated: true, baselineVerified: true, recoveryVerified: true,
  }
}

/** In-memory VM observation only; deliberately has no lifecycle methods. */
export class MockVmController {
  constructor(snapshots = null) {
    this.snapshots = snapshots
  }
  async inspect(target) {
    if (!target || !target.vmRef?.startsWith('mock:')) throw new LabError('REAL_VM_FORBIDDEN')
    const snapshot = this.snapshots === null ? target.vmRef === 'mock:web:001' ? mockWebObservation() : null : this.snapshots.get(target.vmRef)
    if (!snapshot) return null
    if (snapshot.vmRef !== target.vmRef || snapshot.controller !== target.controller || snapshot.disposable !== target.disposable || snapshot.simulated !== true) throw new LabError('MOCK_VM_IDENTITY_MISMATCH')
    return structuredClone(snapshot)
  }
}
