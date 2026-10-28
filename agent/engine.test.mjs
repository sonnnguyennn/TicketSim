import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { LabStore } from './store.mjs'
import { MockLabService } from './service.mjs'
import { MockWebActions } from './mockActions.mjs'
import { MockVmController } from './mockVmController.mjs'
import { createScenarioRegistry, validateRegistryEntry, webPilot } from './registry.mjs'

const stores = []; const tempDirs = []
function memory() { const store = new LabStore(':memory:'); stores.push(store); return store }
function disk() { const dir = mkdtempSync(path.join(tmpdir(), 'ticketsim-lab-test-')); tempDirs.push(dir); return path.join(dir, 'runs.sqlite') }
afterEach(() => {
  for (const store of stores.splice(0)) { try { store.close() } catch { /* Already closed in restart test. */ } }
  for (const dir of tempDirs.splice(0)) if (dir.startsWith(path.join(tmpdir(), 'ticketsim-lab-test-'))) rmSync(dir, { recursive: true, force: true })
})
const key = n => `request_key_${String(n).padStart(8, '0')}`

describe('server-owned mock scenario registry', () => {
  it('rejects unknown scenarios, versions, actions, VM bindings and absent recovery policy', () => {
    const registry = createScenarioRegistry()
    expect(registry.get('LAB-WEB-001').mode).toBe('mock-only')
    expect(() => registry.get('LAB-UNKNOWN')).toThrow('UNKNOWN_SCENARIO')
    expect(() => validateRegistryEntry({ ...webPilot, manifest: { ...webPilot.manifest, schemaVersion: 2 } })).toThrow('INVALID_MANIFEST')
    expect(() => validateRegistryEntry({ ...webPilot, manifest: { ...webPilot.manifest, setupActionId: 'unknown' } })).toThrow('UNKNOWN_ACTION_ID')
    expect(() => validateRegistryEntry({ ...webPilot, target: { ...webPilot.target, vmRef: 'lab1' } })).toThrow('INVALID_VM_BINDING')
    expect(() => validateRegistryEntry({ ...webPilot, manifest: { ...webPilot.manifest, rollbackActionId: '' } })).toThrow('INVALID_MANIFEST')
  })
})

describe('SQLite mock lifecycle', () => {
  it('persists a complete simulated run with ordered events and an independent grade', async () => {
    const store = memory(); const service = new MockLabService(store)
    const started = await service.start('LAB-WEB-001', key(1))
    expect(started.phase).toBe('running')
    expect(started.started_at).toBeTruthy()
    expect(store.getLease(started.vm_ref)?.run_id).toBe(started.run_id)
    service.actions.simulateLearnerRepair({ vmRef: started.vm_ref })
    const finished = await service.submit(started.run_id, key(2))
    expect(finished).toMatchObject({ phase: 'completed', grade_status: 'pass', recovery_status: 'verified' })
    expect(finished.completed_at).toBeTruthy()
    expect(store.getLease(started.vm_ref)).toBeNull()
    const events = store.getEvents(started.run_id)
    expect(events.map(event => event.sequence)).toEqual([...Array(events.length)].map((_, index) => index + 1))
    expect(events.some(event => event.event_type === 'grade_check' && event.metadata.checkId === 'mock-web-http-v1' && event.metadata.outcome === 'pass')).toBe(true)
    expect(events.every(event => event.metadata.simulated === true)).toBe(true)
  })

  it('fails preflight without creating a run or lease', async () => {
    const store = memory(); const service = new MockLabService(store, { actions: new MockWebActions({ failAt: 'preflight' }) })
    await expect(service.start('LAB-WEB-001', key(3))).rejects.toThrow('MOCK_PREFLIGHT_ERROR')
    expect(store.listRuns()).toHaveLength(0)
    expect(store.getLease(webPilot.target.vmRef)).toBeNull()
  })

  it('requires a simulated VM observation and rejects real VM references', async () => {
    const store = memory(); const controller = new MockVmController(new Map())
    const service = new MockLabService(store, { controller })
    await expect(service.start('LAB-WEB-001', key(20))).rejects.toThrow('MOCK_VM_PREFLIGHT_FAILED')
    await expect(controller.inspect({ vmRef: 'lab1', controller: 'hyperv', disposable: false })).rejects.toThrow('REAL_VM_FORBIDDEN')
    expect(store.listRuns()).toHaveLength(0)
  })

  it('uses the injected independent grader rather than the setup action state', async () => {
    const store = memory(); const actions = new MockWebActions(); const grader = new MockWebActions()
    const service = new MockLabService(store, { actions, grader })
    const run = await service.start('LAB-WEB-001', key(21))
    actions.simulateLearnerRepair({ vmRef: run.vm_ref })
    const result = await service.submit(run.run_id, key(22))
    expect(result.phase).toBe('completed')
    expect(result.grade_status).toBe('fail')
    expect(result.recovery_status).toBe('verified')
  })

  it.each(['setup', 'fault_check'])('recovers after %s failure without opening a learner run', async failAt => {
    const store = memory(); const service = new MockLabService(store, { actions: new MockWebActions({ failAt }) })
    const run = await service.start('LAB-WEB-001', key(failAt === 'setup' ? 4 : 5))
    expect(run.phase).toBe('completed')
    expect(run.grade_status).toBeNull()
    expect(run.recovery_status).toBe('verified')
    expect(run.error_code).toBeTruthy()
    expect(store.getLease(run.vm_ref)).toBeNull()
    expect(store.getEvents(run.run_id).some(event => event.event_type === 'mock_setup_failed')).toBe(true)
  })

  it('records grader error then recovers', async () => {
    const store = memory(); const service = new MockLabService(store, { actions: new MockWebActions({ failAt: 'grader' }) })
    const run = await service.start('LAB-WEB-001', key(6))
    const result = await service.submit(run.run_id, key(7))
    expect(result.phase).toBe('completed')
    expect(result.error_code).toBe('MOCK_GRADER_ERROR')
    expect(result.grade_status).toBeNull()
    expect(result.recovery_status).toBe('verified')
  })

  it('keeps lease blocked when recovery fails', async () => {
    const store = memory(); const service = new MockLabService(store, { actions: new MockWebActions({ failAt: 'recovery' }) })
    const run = await service.start('LAB-WEB-001', key(8))
    const failed = await service.submit(run.run_id, key(9))
    expect(failed).toMatchObject({ phase: 'restore_failed', recovery_status: 'failed' })
    expect(store.getLease(run.vm_ref)?.lease_state).toBe('unknown')
    await expect(service.start('LAB-WEB-001', key(10))).rejects.toThrow('VM_LEASE_HELD')
  })

  it('deduplicates starts and submissions, and rejects conflicting reuse', async () => {
    const store = memory(); const service = new MockLabService(store)
    const first = await service.start('LAB-WEB-001', key(11))
    const duplicate = await service.start('LAB-WEB-001', key(11))
    expect(duplicate.run_id).toBe(first.run_id)
    const submitted = await service.submit(first.run_id, key(12))
    const repeat = await service.submit(first.run_id, key(12))
    expect(repeat.event_sequence).toBe(submitted.event_sequence)
    expect(store.listRuns()).toHaveLength(1)
    await expect(service.start('LAB-WEB-001', key(12))).rejects.toThrow('IDEMPOTENCY_KEY_REUSED')
    await expect(service.submit(first.run_id, key(13))).rejects.toThrow('RUN_NOT_SUBMITTABLE')
  })

  it('rejects a malformed lifecycle transition without changing persisted state', async () => {
    const store = memory(); const service = new MockLabService(store)
    const run = await service.start('LAB-WEB-001', key(19))
    const before = store.getEvents(run.run_id).length
    expect(() => store.transition(run.run_id, 'running', 'ready', 'invalid')).toThrow('INVALID_TRANSITION')
    expect(store.getRun(run.run_id).phase).toBe('running')
    expect(store.getEvents(run.run_id)).toHaveLength(before)
  })

  it('serializes competing requests for one VM', async () => {
    const store = memory(); const service = new MockLabService(store)
    const results = await Promise.allSettled([service.start('LAB-WEB-001', key(14)), service.start('LAB-WEB-001', key(15))])
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter(result => result.status === 'rejected')[0].reason.code).toBe('VM_LEASE_HELD')
    expect(store.listRuns()).toHaveLength(1)
  })

  it('marks an interrupted active run and lease unknown after restart', async () => {
    const filename = disk(); const firstStore = new LabStore(filename); stores.push(firstStore)
    const service = new MockLabService(firstStore)
    const run = await service.start('LAB-WEB-001', key(16))
    firstStore.close()
    const reopened = new LabStore(filename); stores.push(reopened)
    reopened.markInterruptedOnStartup()
    expect(reopened.getRun(run.run_id).phase).toBe('recovery_required')
    expect(reopened.getLease(run.vm_ref).lease_state).toBe('unknown')
    expect(reopened.getEvents(run.run_id).at(-1).event_type).toBe('interrupted')
    await expect(new MockLabService(reopened).start('LAB-WEB-001', key(17))).rejects.toThrow('VM_LEASE_HELD')
  })

  it('retains a completed run and ordered events across a restart', async () => {
    const filename = disk(); const firstStore = new LabStore(filename); stores.push(firstStore)
    const service = new MockLabService(firstStore)
    const run = await service.start('LAB-WEB-001', key(23))
    const finished = await service.submit(run.run_id, key(24))
    const before = firstStore.getEvents(run.run_id)
    firstStore.close()
    const reopened = new LabStore(filename); stores.push(reopened)
    reopened.markInterruptedOnStartup()
    expect(reopened.getRun(run.run_id).phase).toBe('completed')
    expect(reopened.getRun(run.run_id).event_sequence).toBe(finished.event_sequence)
    expect(reopened.getEvents(run.run_id)).toEqual(before)
    expect(reopened.getLease(run.vm_ref)).toBeNull()
  })

  it('migrates a v1 database to v2 and rejects a future schema', () => {
    const filename = disk(); const db = new DatabaseSync(filename)
    db.exec(`CREATE TABLE lab_runs (run_id TEXT PRIMARY KEY, scenario_id TEXT NOT NULL, scenario_version INTEGER NOT NULL, vm_ref TEXT NOT NULL, controller TEXT NOT NULL, phase TEXT NOT NULL, recovery_status TEXT NOT NULL, created_at TEXT NOT NULL, started_at TEXT, completed_at TEXT, updated_at TEXT NOT NULL, event_sequence INTEGER NOT NULL, error_code TEXT, grade_status TEXT);
      CREATE TABLE lab_events (run_id TEXT NOT NULL REFERENCES lab_runs(run_id), sequence INTEGER NOT NULL, event_type TEXT NOT NULL, occurred_at TEXT NOT NULL, metadata_json TEXT NOT NULL, PRIMARY KEY(run_id, sequence));
      CREATE TABLE vm_leases (vm_ref TEXT PRIMARY KEY, run_id TEXT NOT NULL REFERENCES lab_runs(run_id), lease_state TEXT NOT NULL, acquired_at TEXT NOT NULL); PRAGMA user_version = 1;`)
    db.close()
    const migrated = new LabStore(filename); stores.push(migrated)
    expect(migrated.db.prepare('PRAGMA user_version').get().user_version).toBe(2)
    expect(migrated.db.prepare("SELECT name FROM sqlite_master WHERE name = 'request_dedup'").get().name).toBe('request_dedup')
    migrated.close()
    const future = new DatabaseSync(filename); future.exec('PRAGMA user_version = 3'); future.close()
    expect(() => new LabStore(filename)).toThrow('DATABASE_VERSION_UNSUPPORTED')
  })

  it('rejects metadata that could carry secrets', async () => {
    const store = memory(); const service = new MockLabService(store)
    const run = await service.start('LAB-WEB-001', key(18))
    expect(() => store.appendEvent(run.run_id, 'note', { simulated: true, password: 'secret' })).toThrow('INVALID_EVENT_METADATA')
    expect(store.getEvents(run.run_id).at(-1).event_type).toBe('mock_run_started')
  })
})
