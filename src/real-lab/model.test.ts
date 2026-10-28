import { describe, expect, it } from 'vitest'
import Ajv from 'ajv'
import manifestSchema from './manifest.schema.json'
import { MockReadOnlyVmController } from './mockController'
import { preflightReady, transitionLabRun, validateLabScenario } from './model'
import type { LabRun, LabScenario, PreflightResult } from './model'

const scenario: LabScenario = {
  schemaVersion: 1, id: 'LAB-SSH-001', revision: 1, title: 'SSH service', relatedTicketIds: ['VPS-01-001'],
  guestOS: 'ubuntu-22.04', vmProfileId: 'ubuntu-basic-v1', controller: 'hyperv', setupActionId: 'setup-ssh-v1',
  faultCheckIds: ['ssh-stopped-v1'], gradeCheckIds: ['ssh-connect-v1'], rollbackActionId: 'restore-baseline-v1',
  safety: { disposableOnly: true, hostRecoveryRequired: true, maxMinutes: 25 },
}

const run: LabRun = { id: 'run-1', scenarioId: scenario.id, scenarioRevision: 1, targetVmId: 'disposable-1', controller: 'hyperv', phase: 'idle', createdAt: '2026-10-29T00:00:00Z', updatedAt: '2026-10-29T00:00:00Z', eventSequence: 0 }

describe('Real Lab Phase 0 contracts', () => {
  it('accepts a versioned manifest and rejects unsafe or unknown fields', () => {
    const validateJson = new Ajv().compile(manifestSchema)
    expect(validateJson(scenario)).toBe(true)
    expect(validateJson({ ...scenario, setupScript: 'rm -rf /' })).toBe(false)
    expect(validateJson({ ...scenario, schemaVersion: 2 })).toBe(false)
    expect(validateJson({ ...scenario, title: '   ' })).toBe(false)
    expect(validateLabScenario(scenario).valid).toBe(true)
    expect(validateLabScenario({ ...scenario, schemaVersion: 2 }).valid).toBe(false)
    expect(validateLabScenario({ ...scenario, setupScript: 'rm -rf /' }).valid).toBe(false)
    expect(validateLabScenario({ ...scenario, safety: { ...scenario.safety, disposableOnly: false } }).valid).toBe(false)
    expect(validateLabScenario({ ...scenario, gradeCheckIds: [] }).valid).toBe(false)
  })

  it('requires ordered lifecycle transitions and monotonic events', () => {
    expect(() => transitionLabRun(run, 'running', '2026-10-29T00:00:01Z')).toThrow('Invalid lab transition')
    const first = transitionLabRun(run, 'preflight', '2026-10-29T00:00:01Z')
    expect(first.eventSequence).toBe(1)
    expect(() => transitionLabRun(first, 'ready', '2026-10-29T00:00:02Z')).toThrow('Invalid lab transition')
    expect(() => transitionLabRun(first, 'baseline_ready', '2026-10-28T00:00:00Z')).toThrow('precedes')
    expect(transitionLabRun(first, 'baseline_ready', '2026-10-29T00:00:02Z').phase).toBe('baseline_ready')
    expect(() => transitionLabRun({ ...first, targetVmId: '' }, 'baseline_ready', '2026-10-29T00:00:02Z')).toThrow('identity')
  })

  it('never treats unknown host checks as ready', () => {
    const result: PreflightResult = { checkedAt: '2026-10-29T00:00:00Z', host: 'windows', targetVmId: 'vm-1', controller: 'hyperv', ready: true, checks: [{ id: 'backup', status: 'unknown', detail: 'not verified' }] }
    expect(preflightReady(result)).toBe(false)
    expect(preflightReady({ ...result, checks: [{ ...result.checks[0], status: 'pass' }] })).toBe(true)
    expect(preflightReady({ ...result, targetVmId: null })).toBe(false)
  })

  it('rejects inspecting a VM through a different owner', async () => {
    const controller = new MockReadOnlyVmController('hyperv')
    await expect(controller.inspect({ id: 'lab1', controller: 'multipass', disposable: false })).rejects.toThrow('ownership')
    await expect(controller.inspect({ id: 'lab1', controller: 'hyperv', disposable: false })).resolves.toBeNull()
  })
  it('rejects inconsistent mock snapshots and does not expose mutable state', async () => {
    const wrong = new MockReadOnlyVmController('hyperv', new Map([['vm-1', { identity: { id: 'vm-2', controller: 'hyperv', disposable: true }, powerState: 'running', observedAt: '2026-10-29T00:00:00Z' }]]))
    await expect(wrong.inspect({ id: 'vm-1', controller: 'hyperv', disposable: true })).rejects.toThrow('identity mismatch')
    const good = new MockReadOnlyVmController('hyperv', new Map([['vm-1', { identity: { id: 'vm-1', controller: 'hyperv', disposable: true }, powerState: 'running', observedAt: '2026-10-29T00:00:00Z' }]]))
    const first = await good.inspect({ id: 'vm-1', controller: 'hyperv', disposable: true })
    first!.powerState = 'off'
    expect((await good.inspect({ id: 'vm-1', controller: 'hyperv', disposable: true }))?.powerState).toBe('running')
  })
})
