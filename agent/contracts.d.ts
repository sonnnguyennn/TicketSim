export interface MockVmIdentity { vmRef: `mock:${string}`; controller: 'hyperv' | 'multipass'; disposable: true }
export interface MockVmSnapshot extends MockVmIdentity { powerState: 'running' | 'off' | 'unknown'; simulated: true }
export interface VmObserver { inspect(target: MockVmIdentity): Promise<MockVmSnapshot | null> }
export interface ScenarioActions {
  preflight(target: MockVmIdentity): Promise<boolean>
  setup(target: MockVmIdentity): Promise<void>
  verifyFault(target: MockVmIdentity): Promise<boolean>
}
export interface IndependentGrader {
  grade(target: MockVmIdentity): Promise<{ score: number; checks: Record<string, boolean> }>
}
export interface RecoveryController {
  recover(target: MockVmIdentity): Promise<void>
  verifyBaseline(target: MockVmIdentity): Promise<boolean>
}

/** Server-owned profile v1. Reference profiles cannot authorize a run. */
export interface VmProfileV1 {
  schemaVersion: 1
  profileId: string
  mode: 'reference-only' | 'mock-only'
  vm: { name: string; vmRef: string; hypervVmId: string; controller: 'hyperv' | 'multipass' | 'unconfirmed'; generation: 2 }
  network: {
    management: { interfaceName: string; ipv4Address: string; prefixLength: number; addressPolicy: 'static-observed'; expectedMac: string; hostIpv4Address: string | null; switchId: string | null; switchName: string | null; switchType: 'internal' | 'external' | 'private' | 'unknown'; sshHostKeyFingerprint: string | null }
    dynamic: { interfaceName: string; addressPolicy: 'dynamic'; lastObservedIpv4: string | null }
  }
  authorization: { disposableApproved: boolean; allowedScenarioIds: string[]; baselineId: string | null; recoveryProofId: string | null; privilegePolicy: 'none' | 'mock-only' }
}

export type VerificationStatus = 'pass' | 'fail' | 'unknown'
export interface VmEndpointVerification {
  checks: Record<string, VerificationStatus>
  verifiedManagementEndpoint: boolean
  readyForMockRun: boolean
  readyForRealRun: false
}
