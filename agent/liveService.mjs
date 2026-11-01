import { randomUUID } from 'node:crypto'
import { LabError } from './errors.mjs'
import { createLiveScenarioRegistry } from './registry.mjs'
import { LIVE_TARGET, assertLiveApproval, assertLiveObservation, checkVerdict, liveChecks } from './livePolicy.mjs'

const validKey = key => typeof key === 'string' && /^[A-Za-z0-9_-]{16,128}$/.test(key)
const target = Object.freeze({ vmRef: LIVE_TARGET.vmRef, controller: 'hyperv', disposable: true })
const metadata = extra => ({ simulated: false, ...extra })

/** The operations object is supplied only by the separate operator bridge, never by HTTP input. */
export class LiveLabService {
  constructor(store, operations, approval, { registry = createLiveScenarioRegistry() } = {}) {
    this.store = store; this.operations = operations; this.approval = approval; this.registry = registry; this.inflight = new Map()
  }
  #once(key, work) {
    if (this.inflight.has(key)) return this.inflight.get(key)
    const promise = work().finally(() => this.inflight.delete(key))
    this.inflight.set(key, promise); return promise
  }
  async #observe(stage) {
    const observation = assertLiveObservation(await this.operations.observe(stage, this.approval), this.approval)
    const verdict = checkVerdict(observation.checks, liveChecks[stage])
    return { observation, verdict }
  }
  start(scenarioId, requestKey) {
    if (!validKey(requestKey)) throw new LabError('INVALID_IDEMPOTENCY_KEY', 400)
    const entry = this.registry.get(scenarioId)
    return this.#once(`start:${requestKey}`, async () => {
      assertLiveApproval(this.approval)
      const prior = this.store.getRequest(requestKey)
      if (prior) {
        if (prior.operation !== `start:${scenarioId}` || this.store.getRun(prior.run_id)?.mode !== 'real') throw new LabError('IDEMPOTENCY_KEY_REUSED')
        return this.store.getRun(prior.run_id)
      }
      if (this.store.getLease(target.vmRef)) throw new LabError('VM_LEASE_HELD')
      const first = await this.#observe('preflight')
      if (first.verdict !== 'pass') throw new LabError(`LIVE_PREFLIGHT_${first.verdict.toUpperCase()}`)
      const created = this.store.createRun({ runId: randomUUID(), scenarioId, scenarioVersion: entry.manifest.revision, target: entry.target, requestKey, at: new Date().toISOString(), mode: 'real' })
      if (created.duplicate) return created.run
      const id = created.run.run_id
      try {
        await this.operations.claim(this.approval, id)
        const second = await this.#observe('preflight')
        this.store.appendEvent(id, 'preflight_checked', metadata({ checkId: 'real-web-preflight-v1', outcome: second.verdict }))
        if (second.verdict !== 'pass') throw new LabError('LIVE_PREFLIGHT_CHANGED')
        this.store.transition(id, 'preflight', 'baseline_ready', 'preflight_passed', metadata())
        this.store.transition(id, 'baseline_ready', 'injecting', 'fault_started', metadata({ operationId: entry.manifest.setupActionId }))
        await this.operations.inject(this.approval, id)
        const fault = await this.#observe('fault')
        this.store.appendEvent(id, 'fault_checked', metadata({ checkId: 'real-web-fault-v1', outcome: fault.verdict }))
        if (fault.verdict !== 'pass') throw new LabError('LIVE_FAULT_NOT_VERIFIED')
        this.store.transition(id, 'injecting', 'ready', 'fault_verified', metadata())
        this.store.transition(id, 'ready', 'running', 'learner_started', metadata())
      } catch (error) {
        const phase = this.store.getRun(id)?.phase
        const code = error instanceof LabError ? error.code : 'LIVE_SETUP_ERROR'
        if (phase === 'injecting') this.store.transition(id, 'injecting', 'failed_setup', 'fault_setup_failed', metadata({ errorCode: code }), { errorCode: code })
        else if (phase === 'preflight' || phase === 'baseline_ready') this.store.transition(id, phase, 'recovery_required', 'preflight_changed', metadata({ errorCode: code }), { recoveryStatus: 'unknown', errorCode: code })
        if (this.store.getRun(id)?.phase === 'failed_setup') return this.#recover(id)
      }
      return this.store.getRun(id)
    })
  }
  submit(runId, requestKey, evidenceNote = '') {
    if (!validKey(requestKey)) throw new LabError('INVALID_IDEMPOTENCY_KEY', 400)
    return this.#once(`finish:${runId}`, async () => {
      assertLiveApproval(this.approval)
      const run = this.store.getRun(runId)
      if (!run) throw new LabError('UNKNOWN_RUN', 404)
      const entry = this.registry.get(run.scenario_id)
      if (run.mode !== 'real' || run.vm_ref !== entry.target.vmRef || run.scenario_version !== entry.manifest.revision) throw new LabError('INVALID_VM_BINDING')
      const reserved = this.store.reserveSubmission(runId, requestKey, new Date().toISOString(), evidenceNote)
      if (reserved.duplicate) return reserved.run
      this.store.transition(runId, 'running', 'submitting', 'submission_received', metadata())
      try {
        const grade = await this.#observe('grade')
        for (const checkId of liveChecks.grade) this.store.appendEvent(runId, 'grade_check', metadata({ checkId: `real-${checkId.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}-v1`, outcome: grade.observation.checks[checkId] }))
        this.store.transition(runId, 'submitting', 'graded', 'grade_recorded', metadata({ outcome: grade.verdict, score: grade.verdict === 'pass' ? 65 : 0 }), { gradeStatus: grade.verdict })
      } catch (error) {
        const code = error instanceof LabError ? error.code : 'LIVE_GRADER_ERROR'
        this.store.transition(runId, 'submitting', 'failed_grading', 'grader_failed', metadata({ errorCode: code }), { errorCode: code, gradeStatus: 'unknown' })
      }
      return this.#recover(runId)
    })
  }
  async expireOverdue(now = Date.now()) {
    const overdue = this.store.listRuns().filter(run => run.mode === 'real' && run.phase === 'running' && (!run.started_at || now - Date.parse(run.started_at) >= this.registry.get(run.scenario_id).manifest.safety.maxMinutes * 60_000))
    for (const run of overdue) await this.#once(`finish:${run.run_id}`, async () => {
      if (this.store.getRun(run.run_id)?.phase !== 'running') return
      this.store.transition(run.run_id, 'running', 'failed_grading', 'learner_timeout', metadata({ errorCode: 'LEARNER_TIMEOUT' }), { gradeStatus: 'unknown', errorCode: 'LEARNER_TIMEOUT' })
      await this.#recover(run.run_id)
    })
  }
  async #recover(runId) {
    const phase = this.store.getRun(runId)?.phase
    if (!['graded','failed_setup','failed_grading'].includes(phase)) throw new LabError('RECOVERY_PHASE_INVALID')
    this.store.transition(runId, phase, 'restoring', 'reset_started', metadata({ operationId: 'real-web-fast-reset-v1' }), { recoveryStatus: 'in_progress' })
    try {
      await this.operations.reset(this.approval, runId)
      const baseline = await this.#observe('reset')
      this.store.appendEvent(runId, 'baseline_checked', metadata({ checkId: 'real-web-baseline-v1', outcome: baseline.verdict }))
      if (baseline.verdict !== 'pass') throw new LabError('LIVE_BASELINE_NOT_VERIFIED')
      this.store.transition(runId, 'restoring', 'verified_clean', 'baseline_verified', metadata(), { recoveryStatus: 'verified' })
      return this.store.finish(runId)
    } catch (error) {
      const code = error instanceof LabError ? error.code : 'LIVE_RESET_ERROR'
      this.store.transition(runId, 'restoring', 'restore_failed', 'reset_failed', metadata({ errorCode: code }), { recoveryStatus: 'failed', errorCode: code })
      return this.store.getRun(runId)
    }
  }
}
