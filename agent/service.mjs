import { randomUUID } from 'node:crypto'
import { LabError } from './errors.mjs'
import { createScenarioRegistry } from './registry.mjs'
import { MockWebActions } from './mockActions.mjs'
import { MockVmController } from './mockVmController.mjs'
import { mockWebProfile } from './vmProfiles.mjs'
import { verifyVmEndpoint } from './vmProfile.mjs'

const validKey = key => typeof key === 'string' && /^[A-Za-z0-9_-]{16,128}$/.test(key)

export class MockLabService {
  constructor(store, { registry = createScenarioRegistry(), actions = new MockWebActions(), controller = new MockVmController(), grader = actions, recovery = actions } = {}) {
    this.store = store; this.registry = registry; this.actions = actions; this.controller = controller; this.grader = grader; this.recovery = recovery; this.inflight = new Map()
  }
  #once(key, work) {
    if (this.inflight.has(key)) return this.inflight.get(key)
    const promise = work().finally(() => this.inflight.delete(key))
    this.inflight.set(key, promise)
    return promise
  }
  start(scenarioId, requestKey) {
    if (!validKey(requestKey)) throw new LabError('INVALID_IDEMPOTENCY_KEY', 400)
    const entry = this.registry.get(scenarioId)
    return this.#once(`start:${scenarioId}:${requestKey}`, async () => {
      const existing = this.store.getRequest(requestKey)
      if (existing) {
        if (existing.operation !== `start:${scenarioId}`) throw new LabError('IDEMPOTENCY_KEY_REUSED')
        return this.store.getRun(existing.run_id)
      }
      const vm = await this.controller.inspect(entry.target)
      const endpoint = verifyVmEndpoint(mockWebProfile, vm, { scenarioId })
      if (!vm || vm.simulated !== true || !endpoint.readyForMockRun) throw new LabError('MOCK_VM_PREFLIGHT_FAILED')
      if (!await this.actions.preflight(entry.target)) throw new LabError('MOCK_PREFLIGHT_FAILED')
      const created = this.store.createRun({ runId: randomUUID(), scenarioId, scenarioVersion: entry.manifest.revision, target: entry.target, requestKey, at: new Date().toISOString() })
      if (created.duplicate) return created.run
      const id = created.run.run_id
      try {
        this.store.transition(id, 'preflight', 'baseline_ready', 'preflight_passed', { simulated: true, checkId: entry.preflightCheckId, outcome: 'pass' })
        this.store.transition(id, 'baseline_ready', 'injecting', 'mock_setup_started')
        await this.actions.setup(entry.target)
        const faultVerified = await this.actions.verifyFault(entry.target)
        this.store.appendEvent(id, 'fault_checked', { simulated: true, checkId: entry.manifest.faultCheckIds[0], outcome: faultVerified ? 'pass' : 'fail' })
        if (!faultVerified) throw new LabError('MOCK_FAULT_NOT_VERIFIED')
        this.store.transition(id, 'injecting', 'ready', 'mock_fault_ready')
        this.store.transition(id, 'ready', 'running', 'mock_run_started')
        return this.store.getRun(id)
      } catch (error) {
        const code = error instanceof LabError ? error.code : 'MOCK_SETUP_ERROR'
        if (this.store.getRun(id)?.phase === 'injecting') this.store.transition(id, 'injecting', 'failed_setup', 'mock_setup_failed', { simulated: true, errorCode: code }, { errorCode: code })
        return this.#recover(id, entry)
      }
    })
  }
  submit(runId, requestKey) {
    if (!validKey(requestKey)) throw new LabError('INVALID_IDEMPOTENCY_KEY', 400)
    return this.#once(`submit:${runId}:${requestKey}`, async () => {
      const run = this.store.getRun(runId)
      if (!run) throw new LabError('UNKNOWN_RUN', 404)
      const entry = this.registry.get(run.scenario_id)
      if (run.vm_ref !== entry.target.vmRef || run.scenario_version !== entry.manifest.revision) throw new LabError('INVALID_VM_BINDING')
      const reserved = this.store.reserveSubmission(runId, requestKey, new Date().toISOString())
      if (reserved.duplicate) return reserved.run
      this.store.transition(runId, 'running', 'submitting', 'mock_submission_received')
      try {
        const grade = await this.grader.grade(entry.target)
        if (!grade || !Number.isInteger(grade.score) || grade.score < 0 || grade.score > 100 || entry.manifest.gradeCheckIds.some(id => typeof grade.checks?.[id] !== 'boolean')) throw new LabError('INVALID_MOCK_GRADE')
        for (const checkId of entry.manifest.gradeCheckIds) this.store.appendEvent(runId, 'grade_check', { simulated: true, checkId, outcome: grade.checks[checkId] ? 'pass' : 'fail' })
        this.store.transition(runId, 'submitting', 'graded', 'mock_grade_recorded', { simulated: true, score: grade.score }, { gradeStatus: grade.score === 100 ? 'pass' : 'fail' })
      } catch (error) {
        const code = error instanceof LabError ? error.code : 'MOCK_GRADER_ERROR'
        this.store.transition(runId, 'submitting', 'failed_grading', 'mock_grader_failed', { simulated: true, errorCode: code }, { errorCode: code })
      }
      return this.#recover(runId, entry)
    })
  }
  async #recover(runId, entry) {
    const phase = this.store.getRun(runId)?.phase
    if (!['graded', 'failed_setup', 'failed_grading'].includes(phase)) throw new LabError('RECOVERY_PHASE_INVALID')
    this.store.transition(runId, phase, 'restoring', 'mock_recovery_started', { simulated: true }, { recoveryStatus: 'in_progress' })
    try {
      await this.recovery.recover(entry.target)
      const clean = await this.recovery.verifyBaseline(entry.target)
      this.store.appendEvent(runId, 'baseline_checked', { simulated: true, checkId: entry.recoveryCheckId, outcome: clean ? 'pass' : 'fail' })
      if (!clean) throw new LabError('MOCK_BASELINE_NOT_VERIFIED')
      this.store.transition(runId, 'restoring', 'verified_clean', 'mock_baseline_verified', { simulated: true }, { recoveryStatus: 'verified' })
      return this.store.finish(runId)
    } catch (error) {
      const code = error instanceof LabError ? error.code : 'MOCK_RECOVERY_ERROR'
      this.store.transition(runId, 'restoring', 'restore_failed', 'mock_recovery_failed', { simulated: true, errorCode: code }, { recoveryStatus: 'failed', errorCode: code })
      return this.store.getRun(runId)
    }
  }
}
