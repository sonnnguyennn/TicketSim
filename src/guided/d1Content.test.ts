import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import guidedPublic from '../data/guided-public.json'
import { classifyGuidedCommand, gradeSelection } from './engine'
import { commandLibrary } from './commands'
import { GUIDED_CONTENT_REVISION, revisedGuidedTicketIds } from './contentRevision'
import type { GuidedCase } from './types'

const cases = guidedPublic as GuidedCase[]
const byId = (id: string) => cases.find(item => item.id === id)!
const key = (id: string, question = 'check') => JSON.parse(fs.readFileSync(`public/guided-feedback/${id}/${question}.json`, 'utf8')) as { correctIds: string[]; explanation: string; optionFeedback: Record<string, string> }
const option = (id: string, question: string, optionId: string) => byId(id).questions.find(item => item.id === question)!.options.find(item => item.id === optionId)!

describe('D1 correctness regressions', () => {
  it('uses dated UTC windows for all historical journal probes and matches their events', () => {
    const originalTickets = JSON.parse(fs.readFileSync('starter-data/tickets.json', 'utf8')).tickets as { id: string; probe_outputs: { probe_id: string; command: string; stdout: string }[]; hint: string }[]
    const windows: [string, string, string][] = [
      ['VPS-04-008', 'P1', '02:00'], ['VPS-09-007', 'P1', '09:14'], ['VPS-01-008', 'G1', '23:12'],
    ]
    for (const [id, probeId, eventTime] of windows) {
      const probe = byId(id).probes.find(item => item.id === probeId)!
      expect(probe.command).toContain('2026-10-22')
      expect(probe.command).toContain('UTC')
      expect(probe.command).not.toMatch(/--since\s+(?:today|yesterday|"\d\d:\d\d")/)
      expect(probe.output).toContain(`Oct 22 ${eventTime}`)
      expect(classifyGuidedCommand(probe.command, byId(id).probes, commandLibrary)).toMatchObject({ kind: 'available', probe: { id: probeId } })
      if (probeId === 'P1') expect(option(id, 'check', 'direct').label).toBe(probe.command)
    }
    for (const guidedCase of cases) for (const probe of guidedCase.probes) {
      if (!probe.command.includes('journalctl') || !/--since|--until/.test(probe.command)) continue
      expect(probe.command).not.toMatch(/--since\s+(?:today|yesterday|"\d\d:\d\d")/)
    }
    for (const id of ['VPS-04-008', 'VPS-09-007']) {
      const original = originalTickets.find(item => item.id === id)!
      const initial = original.probe_outputs.find(item => item.probe_id === 'P1')!
      expect(initial.command).toBe(byId(id).probes[0].command)
      expect(initial.stdout).toBe(byId(id).probes[0].output)
      expect(original.hint).toContain('2026-10-22')
    }
  })

  it('asks for a per-hop report before preferring MTR over valid endpoint ping', () => {
    const question = byId('VPS-02-006').questions.find(item => item.id === 'check')!
    expect(question.prompt).toContain('từng hop')
    expect(option('VPS-02-006', 'check', 'wrong1').label).toContain('ping')
    expect(key('VPS-02-006').optionFeedback.wrong1).toContain('Ping đo loss tới endpoint')
    expect(gradeSelection(['direct'], key('VPS-02-006'))).toBe(true)
    expect(gradeSelection(['wrong1'], key('VPS-02-006'))).toBe(false)
  })

  it('asks for panel activity without offering another source of the same restore event', () => {
    const question = byId('VPS-10-006').questions.find(item => item.id === 'check')!
    expect(question.prompt).toContain('lịch sử hoạt động')
    expect(byId('VPS-10-006').probes.find(item => item.command === 'PANEL: restored snapshot metadata')?.output).toContain('restore completed=2026-10-22 10:14 UTC')
    expect(option('VPS-10-006', 'check', 'wrong1').label).toBe('PANEL: newer backup inventory')
    expect(key('VPS-10-006').optionFeedback.wrong1).toContain('không ghi sự kiện restore')
    expect(gradeSelection(['direct'], key('VPS-10-006'))).toBe(true)
    expect(gradeSelection(['wrong1'], key('VPS-10-006'))).toBe(false)
  })

  it('does not assert synchronized memory, OOM and SSH evidence or different DNS resolvers', () => {
    expect(option('VPS-01-008', 'output', 'supported').label).toContain('còn cần xác minh')
    expect(option('VPS-01-008', 'output', 'supported').label).not.toContain('cùng thời điểm')
    expect(byId('VPS-08-008').probes.find(item => item.id === 'P1')?.command).toContain('@1.1.1.1')
    expect(byId('VPS-08-008').probes.find(item => item.id === 'P2')?.command).toContain('@1.1.1.1')
    expect(option('VPS-08-008', 'triage', 'symptom').label).toContain('Cùng resolver')
    expect(key('VPS-08-008', 'triage').correctIds).toEqual(['symptom'])
  })

  it('marks all changed major cases with a stable revision identifier', () => {
    expect(GUIDED_CONTENT_REVISION).toBe('D1-2026-10-26')
    expect(revisedGuidedTicketIds.size).toBe(15)
  })

  it('keeps post-action ss tables and the SSH debug probe consistent with their cards', () => {
    for (const [id, port] of [['VPS-01-001', '22'], ['VPS-03-001', '80']]) {
      const probe = byId(id).probes.find(item => item.command === 'ss -ltnp' && item.requiredState?.includes('changed'))!
      expect(probe.output).toContain('Peer Address:Port')
      expect(probe.output).toContain(`0.0.0.0:${port} 0.0.0.0:*`)
      expect(classifyGuidedCommand(probe.command, byId(id).probes, commandLibrary, 'changed')).toMatchObject({ kind: 'available', probe: { id: probe.id } })
    }
    const ssh = byId('VPS-01-001').probes.find(item => item.id === 'G5')!
    expect(ssh.command).toContain('ssh -vvv')
    expect(commandLibrary.find(card => card.id === ssh.commandId)?.command).toContain('ssh -vvv')
    expect(ssh.output).toContain('debug1:')
    expect(ssh.output).toContain('Permission denied')
  })

  it('provides only the evidence each command can print', () => {
    const dns = byId('VPS-08-008').probes.find(item => item.id === 'P2')!
    expect(dns.output).toContain('ANSWER: 1')
    expect(dns.output).toContain('signed.example.test. 300 IN A 198.51.100.20')
    const top = byId('VPS-10-004').probes.find(item => item.id === 'P1')!
    expect(top.output.split('\n')).toHaveLength(10)
    expect(top.output.split('\n')[0]).toMatch(/^top - /)
    expect(top.output).toContain('%Cpu(s):')
    expect(top.output).toContain('60.0 st')
    expect(top.output).toContain('PID USER')
  })

  it('uses role-aware and plausible alternatives in virtualization and Docker questions', () => {
    expect(byId('VPS-10-001').questions.find(item => item.id === 'check')?.prompt).toContain('quyền VPS support')
    expect(key('VPS-10-001').optionFeedback.wrong2).toContain('NOC')
    expect(option('VPS-13-001', 'output', 'over').label).toContain('image tag')
    expect(option('VPS-13-001', 'decision', 'unsafe').label).toContain('cùng image')
  })
})
