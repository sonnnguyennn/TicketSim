import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import guidedPublic from '../data/guided-public.json'
import { classifyGuidedCommand, gradeSelection } from './engine'
import { commandLibrary } from './commands'
import { GUIDED_CONTENT_REVISION, c2RevisedGuidedTicketIds, guidedContentRevisionFor, hasRevisedGuidedContent, revisedGuidedTicketIds } from './contentRevision'
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
      expect(probe.command).toContain('--utc')
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
      expect(byId(id).probes[0].command).toBe(`${initial.command} --utc`)
      expect(initial.stdout).toBe(byId(id).probes[0].output)
      expect(original.hint).toContain('2026-10-22')
    }
  })

  it('treats the retention deletion date as a historical schedule, not proof of deletion', () => {
    const ticket = byId('VPS-14-006')
    expect(ticket.customerExplanation).toContain('22/10/2026')
    expect(ticket.customerExplanation).toContain('trạng thái deletion job hiện tại')
    const output = ticket.questions.find(item => item.id === 'output')!
    expect(output.prompt).toContain('mốc tiếp nhận 22/10')
    expect(option(ticket.id, 'output', 'supported').label).toContain('chưa hứa dữ liệu được giữ')
    expect(key(ticket.id, 'output').correctIds).toEqual(['supported'])
    expect(gradeSelection(['supported'], key(ticket.id, 'output'))).toBe(true)
    expect(gradeSelection(['ignore'], key(ticket.id, 'output'))).toBe(false)
    expect(key(ticket.id, 'output').optionFeedback.ignore).toContain('trạng thái deletion job')
    expect(ticket.questions.find(item => item.id === 'decision')?.prompt).toContain('mốc 22/10')
    expect(key(ticket.id, 'decision').correctIds).toEqual(['safe'])
    expect(gradeSelection(['safe'], key(ticket.id, 'decision'))).toBe(true)
    expect(gradeSelection(['close'], key(ticket.id, 'decision'))).toBe(false)
    const answer = JSON.parse(fs.readFileSync('public/guided-answers/VPS-14-006.json', 'utf8'))
    expect(answer.expected_diagnosis).toContain('Không biết job đã chạy')
  })

  it('describes the scope of the original OOM tail probe without promising an incident window', () => {
    const question = byId('VPS-01-008').questions.find(item => item.id === 'check')!
    expect(question.prompt).toContain('boot này')
    expect(question.prompt).not.toContain('gần thời gian job')
    expect(key('VPS-01-008', 'check').correctIds).toEqual(['direct'])
  })

  it('asks for the supported memory interpretation without making the false alternative answer the prompt', () => {
    const question = byId('VPS-04-006').questions.find(item => item.id === 'output')!
    expect(question.prompt).toContain('diễn giải nào phù hợp nhất')
    expect(key('VPS-04-006', 'output').correctIds).toEqual(['supported'])
    expect(gradeSelection(['supported'], key('VPS-04-006', 'output'))).toBe(true)
    expect(gradeSelection(['over'], key('VPS-04-006', 'output'))).toBe(false)
  })

  it('keeps the Guided tracepath PMTU sample consistent with the DF probe', () => {
    const ticket = byId('VPS-02-008')
    const trace = ticket.probes.find(item => item.command === 'tracepath 198.51.100.20')!
    expect(trace.output).toContain('pmtu 1400')
    expect(trace.output).toContain('reached')
    expect(trace.output).toContain('Resume: pmtu 1400')
    expect(trace.meaning).toContain('chưa chứng minh HTTPS/TCP')
    expect(ticket.probes.find(item => item.id === 'P1')?.output).toContain('mtu = 1400')
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
    expect([...c2RevisedGuidedTicketIds].sort()).toEqual(['VPS-01-008', 'VPS-02-008', 'VPS-04-006', 'VPS-04-008', 'VPS-09-007', 'VPS-14-006'])
    expect(guidedContentRevisionFor('VPS-14-006')).toBe('D3-C2-2026-10-26')
    expect(guidedContentRevisionFor('VPS-02-006')).toBe(GUIDED_CONTENT_REVISION)
    expect(hasRevisedGuidedContent('VPS-14-006')).toBe(true)
    expect(hasRevisedGuidedContent('VPS-14-005')).toBe(false)
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
