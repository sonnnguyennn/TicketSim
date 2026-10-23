import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import source from '../starter-data/tickets.json'
import publicTickets from './data/tickets-public.json'
import { customerSummary, emptyChecks, emptyExamDraft, emptyProgress, filterTickets, isAnswer, matchProbe, matchProbeForKind, scoreChecks, ticketStatus } from './lib'
import { examMissing } from './exam'
import { loadProgress, migrateProgress, saveProgress, validProgress } from './storage'
import type { LegacyProgress, Progress, Ticket } from './types'

const tickets = publicTickets as Ticket[]

describe('dataset', () => {
  it('imports every ticket and keeps answer fields out of the initial payload', () => {
    expect(tickets).toHaveLength(112)
    expect(new Set(tickets.map(ticket => ticket.id)).size).toBe(112)
    expect(new Set(tickets.map(ticket => ticket.topic)).size).toBe(14)
    expect([0, 1, 2, 3].map(level => tickets.filter(ticket => ticket.difficulty === level).length)).toEqual([28, 28, 28, 28])
    expect(tickets.every(ticket => !('title' in ticket) && !('subject' in ticket) && !('expected_diagnosis' in ticket) && !('resolution_guidance' in ticket))).toBe(true)
    expect(tickets.every(ticket => !('hint' in ticket) && !('production_warning' in ticket))).toBe(true)
    expect(fs.readdirSync('public/answers').filter(name => name.endsWith('.json'))).toHaveLength(112)
    expect(fs.readdirSync('public/hints').filter(name => name.endsWith('.json'))).toHaveLength(112)
    expect(source.tickets).toHaveLength(112)
  })
  it('keeps all 224 probe outputs unchanged', () => {
    for (const ticket of tickets) {
      const original = source.tickets.find(item => item.id === ticket.id)!
      expect(ticket.probe_outputs).toEqual(original.probe_outputs)
      for (const probe of ticket.probe_outputs) {
        const kind = probe.command.startsWith('PANEL:') || probe.command.startsWith('BILLING:') || probe.command.startsWith('BACKUP LOG:') ? 'investigation' : 'terminal'
        expect(matchProbeForKind(ticket.probe_outputs, probe.command, kind)?.stdout).toBe(probe.stdout)
      }
    }
  })
  it('filters by topic, level, status and query', () => {
    const progress: Progress = { ...emptyProgress(), attempts: [{ id: 'a', ticketId: 'VPS-01-001', createdAt: '', form: { issue: '', hypothesis: '', evidence: '', nextCheck: '', action: '', verification: '', escalation: '' }, commands: [], hintViewed: false, selfScore: 0, checks: emptyChecks() }] }
    expect(filterTickets(tickets, { topic: 'SSH', level: '0', status: 'completed', query: 'VPS-01' }, progress).map(ticket => ticket.id)).toEqual(['VPS-01-001'])
    expect(ticketStatus('VPS-01-001', progress)).toBe('completed')
    expect(customerSummary(tickets[0].customer_message)).toContain('SSH')
    expect(filterTickets(tickets, { topic: 'all', level: 'all', status: 'all', query: 'sshd stopped' }, progress)).toHaveLength(0)
  })
})

describe('simulated probes', () => {
  it('matches only exact fixture commands with whitespace/case normalization', () => {
    const probes = tickets[0].probe_outputs
    expect(matchProbe(probes, '  SYSTEMCTL   status  sshd  ')?.stdout).toBe('Active: inactive (dead)')
    expect(matchProbe(probes, 'rm -rf /')).toBeUndefined()
    expect(matchProbe(probes, 'systemctl restart sshd')).toBeUndefined()
    expect(matchProbe(tickets.find(ticket => ticket.id === 'VPS-02-001')!.probe_outputs, 'ip route')?.stdout).not.toContain('default')
    expect(matchProbe(tickets.find(ticket => ticket.id === 'VPS-05-002')!.probe_outputs, 'df -i /')?.stdout).toContain('100%')
  })
  it('routes PANEL/BILLING/BACKUP LOG probes through investigation only', () => {
    const panelOnly = tickets.find(ticket => ticket.id === 'VPS-06-001')!
    expect(matchProbeForKind(panelOnly.probe_outputs, 'PANEL: VM state', 'investigation')?.stdout).toBe('Powered Off')
    expect(matchProbeForKind(panelOnly.probe_outputs, 'PANEL: VM state', 'terminal')).toBeUndefined()
    expect(matchProbeForKind(tickets[0].probe_outputs, 'systemctl status sshd', 'investigation')).toBeUndefined()
  })
})

describe('self scoring and persistence', () => {
  it('calculates rubric weights', () => {
    expect(scoreChecks({ ...emptyChecks(), symptom_identification: true, evidence_reasoning: true, safe_resolution: true })).toBe(7)
  })
  it('round trips local progress', () => {
    const entries = new Map<string, string>()
    const storage = { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => { entries.set(key, value) } }
    const progress = emptyProgress()
    progress.drafts['VPS-01-001'] = { form: { issue: 'SSH failed', hypothesis: '', evidence: '', nextCheck: '', action: '', verification: '', escalation: '' }, commands: [], hintViewed: false, answerRevealed: false, checks: emptyChecks() }
    expect(saveProgress(progress, storage)).toBe(true)
    expect(loadProgress(storage)).toEqual(progress)
    const legacy: LegacyProgress = { version: 1, drafts: progress.drafts, attempts: progress.attempts }
    expect(migrateProgress(legacy)).toEqual(progress)
    const legacyStorage = { getItem: (key: string) => key === 'vps-ticket-simulator-progress-v1' ? JSON.stringify(legacy) : null }
    expect(loadProgress(legacyStorage)).toEqual(progress)
    const previousV2 = { version: 2, drafts: progress.drafts, attempts: progress.attempts, guidedDrafts: {}, guidedAttempts: [] }
    expect(migrateProgress(previousV2)).toEqual(progress)
    const v2Storage = { getItem: (key: string) => key === 'vps-ticket-simulator-progress-v2' ? JSON.stringify(previousV2) : null }
    expect(loadProgress(v2Storage)).toEqual(progress)
    const previousV3 = { ...previousV2, version: 3, reviewAttempts: [] }
    expect(migrateProgress(previousV3)).toEqual(progress)
    const v3Storage = { getItem: (key: string) => key === 'vps-ticket-simulator-progress-v3' ? JSON.stringify(previousV3) : null }
    expect(loadProgress(v3Storage)).toEqual(progress)
    const corruptV3Storage = { getItem: (key: string) => key === 'vps-ticket-simulator-progress-v3' ? '{bad json' : v2Storage.getItem(key) }
    expect(loadProgress(corruptV3Storage)).toEqual(progress)
    expect(validProgress({ ...progress, drafts: { ['__proto__']: progress.drafts['VPS-01-001'] } })).toBe(false)
    expect(validProgress({ ...progress, drafts: { 'VPS-99-999': progress.drafts['VPS-01-001'] } })).toBe(false)
    const attempt = { id: 'attempt', ticketId: 'VPS-01-001', createdAt: new Date().toISOString(), form: progress.drafts['VPS-01-001'].form, commands: [], hintViewed: false, selfScore: Number.NaN, checks: emptyChecks() }
    expect(validProgress({ ...progress, attempts: [attempt] })).toBe(false)
    progress.guidedAttempts.push({ id: 'g', ticketId: 'VPS-01-001', createdAt: '2026-10-20T00:00:00Z', responses: { output: ['stopped'] }, commands: [], hintLevel: 0, note: 'Evidence and next check', score: 1, total: 5, independent: false, outcomes: { output: true } })
    progress.reviewAttempts.push({ id: 'r', ticketId: 'VPS-01-001', sourceAttemptId: 'g', createdAt: '2026-10-21T00:00:00Z', kind: 'mistakes', questionIds: ['output'], responses: { output: ['stopped'] }, outcomes: { output: true } })
    const migratedV3 = migrateProgress({ version: 3, drafts: progress.drafts, attempts: progress.attempts, guidedDrafts: progress.guidedDrafts, guidedAttempts: progress.guidedAttempts, reviewAttempts: progress.reviewAttempts })
    expect(migratedV3?.guidedAttempts).toEqual(progress.guidedAttempts)
    expect(migratedV3?.reviewAttempts).toEqual(progress.reviewAttempts)
    expect(migratedV3?.examAttempts).toEqual([])
    expect(validProgress(progress)).toBe(true)
    expect(saveProgress(progress, storage)).toBe(true)
    expect(loadProgress(storage)).toEqual(progress)
    expect(validProgress({ ...progress, reviewAttempts: [{ ...progress.reviewAttempts[0], outcomes: { output: 'yes' } }] })).toBe(false)
    const examDraft = emptyExamDraft()
    examDraft.form.hypothesis = 'SSH service may be stopped'
    progress.examDrafts['VPS-01-001'] = { ...examDraft, submittedAttemptId: 'exam-1' }
    progress.examAttempts.push({ id: 'exam-1', ticketId: 'VPS-01-001', createdAt: '2026-10-22T00:00:00Z', form: examDraft.form, commands: [], checks: emptyChecks(), selfScore: 0 })
    expect(validProgress(progress)).toBe(true)
    expect(ticketStatus('VPS-01-001', progress)).toBe('completed')
    expect(loadProgress({ getItem: (key: string) => key === 'vps-ticket-simulator-progress-v4' ? JSON.stringify(progress) : null })).toEqual(progress)
    expect(loadProgress({ getItem: (key: string) => key === 'vps-ticket-simulator-progress-v4' ? '{bad json' : key === 'vps-ticket-simulator-progress-v3' ? JSON.stringify({ ...previousV3, guidedAttempts: progress.guidedAttempts, reviewAttempts: progress.reviewAttempts }) : null })?.guidedAttempts).toEqual(progress.guidedAttempts)
    expect(validProgress({ ...progress, examDrafts: { 'VPS-01-001': { ...examDraft, submittedAttemptId: 'missing' } } })).toBe(false)
    expect(validProgress({ ...progress, examAttempts: [{ ...progress.examAttempts[0], selfScore: Number.NaN }] })).toBe(false)
  })
  it('rejects malformed answer data', () => {
    expect(isAnswer({ expected_diagnosis: 3 })).toBe(false)
  })
})

describe('Exam for all tickets', () => {
  it('requires authored evidence and a complete note before revealing answers', () => {
    for (const ticket of tickets) {
      const draft = emptyExamDraft()
      expect(examMissing(draft, ticket)).toContain('thu thập đủ hai fixture P1 và P2')
      draft.commands = ticket.probe_outputs.map(probe => ({ id: probe.probe_id, probeId: probe.probe_id, command: probe.command, output: probe.stdout, kind: probe.command.startsWith('PANEL:') || probe.command.startsWith('BILLING:') || probe.command.startsWith('BACKUP LOG:') ? 'investigation' : 'terminal', supported: true, at: '' }))
      draft.form = { symptom: 'Khách gặp lỗi khi sử dụng dịch vụ.', hypothesis: 'Có thể có vấn đề cần kiểm tra thêm.', evidence: 'P1 và P2 đã được đối chiếu với triệu chứng.', action: 'Chỉ đề xuất xử lý sau khi có quyền phù hợp.', verification: 'Kiểm tra lại dịch vụ từ khách và guest.' }
      expect(examMissing(draft, ticket)).toEqual([])
      draft.commands[0].supported = false
      expect(examMissing(draft, ticket)).toContain('thu thập đủ hai fixture P1 và P2')
    }
  })
})
