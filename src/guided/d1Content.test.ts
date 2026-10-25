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
  })

  it('asks for a per-hop report before preferring MTR over valid endpoint ping', () => {
    const question = byId('VPS-02-006').questions.find(item => item.id === 'check')!
    expect(question.prompt).toContain('từng hop')
    expect(option('VPS-02-006', 'check', 'wrong1').label).toContain('ping')
    expect(key('VPS-02-006').optionFeedback.wrong1).toContain('Ping đo loss tới endpoint')
    expect(gradeSelection(['direct'], key('VPS-02-006'))).toBe(true)
    expect(gradeSelection(['wrong1'], key('VPS-02-006'))).toBe(false)
  })

  it('distinguishes panel activity from metadata without denying metadata completion', () => {
    const question = byId('VPS-10-006').questions.find(item => item.id === 'check')!
    expect(question.prompt).toContain('lịch sử hoạt động')
    expect(byId('VPS-10-006').probes.find(item => item.command === 'PANEL: restored snapshot metadata')?.output).toContain('restore completed=2026-10-22 10:14 UTC')
    expect(key('VPS-10-006').optionFeedback.wrong1).toContain('cũng ghi restore completed')
    expect(gradeSelection(['direct'], key('VPS-10-006'))).toBe(true)
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
    expect(revisedGuidedTicketIds.size).toBe(6)
  })
})
