import { mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { LabError } from './errors.mjs'
import { assertTransition } from './lifecycle.mjs'

export function defaultDatabasePath() {
  const base = process.platform === 'win32' && process.env.LOCALAPPDATA ? process.env.LOCALAPPDATA : path.join(homedir(), '.local', 'share')
  return path.join(base, 'TicketSim', 'real-lab', 'runs.sqlite')
}

const allowedMetadata = Object.freeze({ simulated: value => value === true, checkId: value => typeof value === 'string' && /^mock-[a-z0-9-]+$/.test(value), outcome: value => ['pass', 'fail', 'unknown'].includes(value), errorCode: value => typeof value === 'string' && /^[A-Z0-9_]{1,80}$/.test(value), score: value => Number.isInteger(value) && value >= 0 && value <= 100 })
function metadataJson(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata) || metadata.simulated !== true || Object.entries(metadata).some(([key, value]) => !allowedMetadata[key]?.(value))) throw new LabError('INVALID_EVENT_METADATA', 400)
  return JSON.stringify(metadata)
}

export class LabStore {
  constructor(filename = defaultDatabasePath()) {
    if (filename !== ':memory:') mkdirSync(path.dirname(filename), { recursive: true })
    this.db = new DatabaseSync(filename)
    try {
      this.db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;')
      this.#migrate()
    } catch (error) { this.db.close(); throw error }
  }
  close() { this.db.close() }
  #tx(operation) {
    this.db.exec('BEGIN IMMEDIATE')
    try { const result = operation(); this.db.exec('COMMIT'); return result }
    catch (error) { this.db.exec('ROLLBACK'); throw error }
  }
  #migrate() {
    const version = this.db.prepare('PRAGMA user_version').get().user_version
    if (version > 2) throw new LabError('DATABASE_VERSION_UNSUPPORTED', 500)
    if (version < 1) this.#tx(() => {
      this.db.exec(`
        CREATE TABLE lab_runs (
          run_id TEXT PRIMARY KEY, scenario_id TEXT NOT NULL, scenario_version INTEGER NOT NULL,
          vm_ref TEXT NOT NULL, controller TEXT NOT NULL, phase TEXT NOT NULL,
          recovery_status TEXT NOT NULL, created_at TEXT NOT NULL, started_at TEXT,
          completed_at TEXT, updated_at TEXT NOT NULL, event_sequence INTEGER NOT NULL,
          error_code TEXT, grade_status TEXT
        );
        CREATE TABLE lab_events (
          run_id TEXT NOT NULL REFERENCES lab_runs(run_id), sequence INTEGER NOT NULL,
          event_type TEXT NOT NULL, occurred_at TEXT NOT NULL, metadata_json TEXT NOT NULL,
          PRIMARY KEY (run_id, sequence)
        );
        CREATE TABLE vm_leases (
          vm_ref TEXT PRIMARY KEY, run_id TEXT NOT NULL REFERENCES lab_runs(run_id),
          lease_state TEXT NOT NULL, acquired_at TEXT NOT NULL
        );
        PRAGMA user_version = 1;
      `)
    })
    if (this.db.prepare('PRAGMA user_version').get().user_version < 2) this.#tx(() => {
      this.db.exec(`
        CREATE TABLE request_dedup (
          request_key TEXT PRIMARY KEY, operation TEXT NOT NULL,
          run_id TEXT NOT NULL REFERENCES lab_runs(run_id), created_at TEXT NOT NULL
        );
        PRAGMA user_version = 2;
      `)
    })
  }
  markInterruptedOnStartup() {
    this.#tx(() => {
      const leases = this.db.prepare("SELECT vm_ref, run_id FROM vm_leases WHERE lease_state = 'active'").all()
      for (const lease of leases) {
        this.db.prepare("UPDATE vm_leases SET lease_state = 'unknown' WHERE vm_ref = ?").run(lease.vm_ref)
        const run = this.getRun(lease.run_id)
        if (run && run.phase !== 'completed' && run.phase !== 'restore_failed' && run.phase !== 'recovery_required') {
          const at = new Date().toISOString()
          this.#setPhase(run, 'recovery_required', 'interrupted', at, { simulated: true, errorCode: 'AGENT_RESTART' }, 'unknown', 'AGENT_RESTART')
        }
      }
    })
  }
  getRun(runId) { return this.db.prepare('SELECT * FROM lab_runs WHERE run_id = ?').get(runId) ?? null }
  listRuns() { return this.db.prepare('SELECT * FROM lab_runs ORDER BY created_at DESC, run_id DESC').all() }
  getEvents(runId) { return this.db.prepare('SELECT * FROM lab_events WHERE run_id = ? ORDER BY sequence ASC').all(runId).map(row => ({ ...row, metadata: JSON.parse(row.metadata_json) })) }
  getLease(vmRef) { return this.db.prepare('SELECT * FROM vm_leases WHERE vm_ref = ?').get(vmRef) ?? null }
  getRequest(key) { return this.db.prepare('SELECT * FROM request_dedup WHERE request_key = ?').get(key) ?? null }
  createRun({ runId, scenarioId, scenarioVersion, target, requestKey, at }) {
    return this.#tx(() => {
      const prior = this.getRequest(requestKey)
      if (prior) {
        if (prior.operation !== `start:${scenarioId}`) throw new LabError('IDEMPOTENCY_KEY_REUSED')
        return { run: this.getRun(prior.run_id), duplicate: true }
      }
      if (this.getLease(target.vmRef)) throw new LabError('VM_LEASE_HELD')
      this.db.prepare(`INSERT INTO lab_runs (run_id, scenario_id, scenario_version, vm_ref, controller, phase, recovery_status, created_at, updated_at, event_sequence)
        VALUES (?, ?, ?, ?, ?, 'preflight', 'not_started', ?, ?, 1)`).run(runId, scenarioId, scenarioVersion, target.vmRef, target.controller, at, at)
      this.db.prepare("INSERT INTO vm_leases (vm_ref, run_id, lease_state, acquired_at) VALUES (?, ?, 'active', ?)").run(target.vmRef, runId, at)
      this.db.prepare("INSERT INTO lab_events (run_id, sequence, event_type, occurred_at, metadata_json) VALUES (?, 1, 'created', ?, ?)").run(runId, at, metadataJson({ simulated: true }))
      this.db.prepare('INSERT INTO request_dedup (request_key, operation, run_id, created_at) VALUES (?, ?, ?, ?)').run(requestKey, `start:${scenarioId}`, runId, at)
      return { run: this.getRun(runId), duplicate: false }
    })
  }
  reserveSubmission(runId, key, at) {
    return this.#tx(() => {
      const prior = this.getRequest(key)
      if (prior) {
        if (prior.operation !== 'submit' || prior.run_id !== runId) throw new LabError('IDEMPOTENCY_KEY_REUSED')
        return { duplicate: true, run: this.getRun(runId) }
      }
      const run = this.getRun(runId)
      if (!run) throw new LabError('UNKNOWN_RUN', 404)
      if (run.phase !== 'running') throw new LabError('RUN_NOT_SUBMITTABLE')
      this.db.prepare('INSERT INTO request_dedup (request_key, operation, run_id, created_at) VALUES (?, ?, ?, ?)').run(key, 'submit', runId, at)
      return { duplicate: false, run }
    })
  }
  #setPhase(run, to, eventType, at, metadata, recoveryStatus, errorCode, gradeStatus) {
    assertTransition(run.phase, to)
    const sequence = run.event_sequence + 1
    const startedAt = to === 'running' ? at : run.started_at
    const completedAt = to === 'completed' ? at : run.completed_at
    this.db.prepare(`UPDATE lab_runs SET phase = ?, recovery_status = ?, updated_at = ?, event_sequence = ?,
      started_at = ?, completed_at = ?, error_code = ?, grade_status = ? WHERE run_id = ?`).run(
      to, recoveryStatus ?? run.recovery_status, at, sequence, startedAt, completedAt,
      errorCode ?? run.error_code, gradeStatus ?? run.grade_status, run.run_id)
    this.db.prepare('INSERT INTO lab_events (run_id, sequence, event_type, occurred_at, metadata_json) VALUES (?, ?, ?, ?, ?)').run(run.run_id, sequence, eventType, at, metadataJson(metadata))
    if (to === 'restore_failed' || to === 'recovery_required') this.db.prepare("UPDATE vm_leases SET lease_state = 'unknown' WHERE vm_ref = ? AND run_id = ?").run(run.vm_ref, run.run_id)
    return this.getRun(run.run_id)
  }
  transition(runId, from, to, eventType, metadata = { simulated: true }, options = {}) {
    return this.#tx(() => {
      const run = this.getRun(runId)
      if (!run) throw new LabError('UNKNOWN_RUN', 404)
      if (run.phase !== from) throw new LabError('PHASE_CONFLICT')
      const at = new Date().toISOString()
      if (Date.parse(at) < Date.parse(run.updated_at)) throw new LabError('CLOCK_REGRESSION', 500)
      return this.#setPhase(run, to, eventType, at, metadata, options.recoveryStatus, options.errorCode, options.gradeStatus)
    })
  }
  appendEvent(runId, eventType, metadata) {
    return this.#tx(() => {
      const run = this.getRun(runId)
      if (!run || run.phase === 'completed') throw new LabError('EVENT_NOT_ALLOWED')
      const sequence = run.event_sequence + 1
      const at = new Date().toISOString()
      this.db.prepare('UPDATE lab_runs SET event_sequence = ?, updated_at = ? WHERE run_id = ?').run(sequence, at, runId)
      this.db.prepare('INSERT INTO lab_events (run_id, sequence, event_type, occurred_at, metadata_json) VALUES (?, ?, ?, ?, ?)').run(runId, sequence, eventType, at, metadataJson(metadata))
      return sequence
    })
  }
  finish(runId) {
    return this.#tx(() => {
      const run = this.getRun(runId)
      if (!run || run.phase !== 'verified_clean') throw new LabError('RECOVERY_NOT_VERIFIED')
      const lease = this.getLease(run.vm_ref)
      if (!lease || lease.run_id !== runId || lease.lease_state !== 'active') throw new LabError('LEASE_NOT_ACTIVE')
      const at = new Date().toISOString()
      const finished = this.#setPhase(run, 'completed', 'completed', at, { simulated: true }, 'verified')
      this.db.prepare('DELETE FROM vm_leases WHERE vm_ref = ? AND run_id = ?').run(run.vm_ref, runId)
      return finished
    })
  }
}
