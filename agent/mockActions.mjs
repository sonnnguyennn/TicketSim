import { LabError } from './errors.mjs'

/** No imports for child processes, network clients, Hyper-V or Multipass. */
export class MockWebActions {
  constructor({ failAt = null } = {}) { this.failAt = failAt; this.states = new Map() }
  #fail(point) { if (this.failAt === point) throw new LabError(`MOCK_${point.toUpperCase()}_ERROR`, 500) }
  async preflight(target) { this.#fail('preflight'); return target.vmRef.startsWith('mock:') && target.disposable === true }
  async setup(target) {
    this.#fail('setup')
    this.states.set(target.vmRef, { sshReachable: true, nginxInstalled: true, nginxRunning: false, configValid: true, httpOk: false, baseline: false })
  }
  async verifyFault(target) { this.#fail('fault'); const state = this.states.get(target.vmRef); return this.failAt !== 'fault_check' && !!state && state.sshReachable && state.nginxInstalled && !state.nginxRunning && !state.httpOk }
  /** Test harness only; never mounted on an HTTP route. */
  simulateLearnerRepair(target) {
    const state = this.states.get(target.vmRef)
    if (!state) throw new LabError('MOCK_STATE_MISSING')
    state.nginxRunning = true; state.httpOk = true
  }
  async grade(target) {
    this.#fail('grader')
    const state = this.states.get(target.vmRef)
    return { score: state?.nginxRunning && state?.configValid && state?.httpOk && state?.sshReachable ? 100 : 0,
      checks: { 'mock-web-http-v1': !!state?.httpOk, 'mock-web-nginx-config-v1': !!state?.configValid, 'mock-web-ssh-preserved-v1': !!state?.sshReachable } }
  }
  async recover(target) { this.#fail('recovery'); this.states.set(target.vmRef, { sshReachable: true, nginxInstalled: true, nginxRunning: true, configValid: true, httpOk: true, baseline: true }) }
  async verifyBaseline(target) { this.#fail('recovery_check'); return !!this.states.get(target.vmRef)?.baseline }
}
