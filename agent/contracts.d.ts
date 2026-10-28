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
