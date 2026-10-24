import { describe, expect, it } from 'vitest'
import guidedPublic from '../data/guided-public.json'
import { commandLibrary } from './commands'
import { classifyGuidedCommand } from './engine'
import type { GuidedCase } from './types'

const cases = guidedPublic as GuidedCase[]
const item = (id: string) => cases.find(entry => entry.id === id)!

describe('Reviewed command scope boundaries', () => {
  it('does not return stopped Compose containers for the running-only command', () => {
    const compose = item('VPS-13-007')
    const all = classifyGuidedCommand('docker compose ps --all', compose.probes, commandLibrary)
    expect(all.kind).toBe('available')
    if (all.kind === 'available') expect(all.probe.output).toContain('Exited')
    expect(classifyGuidedCommand('docker compose ps', compose.probes, commandLibrary).kind).not.toBe('available')
  })

  it('does not serve container quota evidence from the guest root cgroup command', () => {
    const quota = item('VPS-04-005')
    const container = classifyGuidedCommand('docker exec api cat /sys/fs/cgroup/cpu.stat', quota.probes, commandLibrary)
    expect(container.kind).toBe('available')
    if (container.kind === 'available') expect(container.probe.output).toContain('nr_throttled')
    expect(classifyGuidedCommand('cat /sys/fs/cgroup/cpu.stat', quota.probes, commandLibrary).kind).not.toBe('available')
  })

  it('keeps empty account lookup output distinct from an unmatched command', () => {
    const account = item('VPS-01-002')
    const absent = classifyGuidedCommand('getent passwd admin', account.probes, commandLibrary)
    expect(absent.kind).toBe('available')
    if (absent.kind === 'available') {
      expect(absent.probe.output).toBe('')
      expect(absent.probe.meaning.length).toBeGreaterThan(10)
    }
    expect(classifyGuidedCommand('getent passwd someone-else', account.probes, commandLibrary).kind).not.toBe('available')
  })
})
