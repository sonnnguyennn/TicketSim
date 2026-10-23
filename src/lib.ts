import type { Answer, Draft, ExamDraft, FormFields, Probe, Progress, ScoreChecks, ScoreKey, Ticket } from './types'

export const SCORE_LABELS: Record<ScoreKey, string> = {
  symptom_identification: 'Nhận diện triệu chứng',
  evidence_reasoning: 'Lập luận từ bằng chứng',
  additional_checks: 'Lệnh kiểm tra tiếp',
  safe_resolution: 'Hướng xử lý an toàn',
  verification_or_escalation: 'Xác minh / escalation',
}
export const SCORE_KEYS = Object.keys(SCORE_LABELS) as ScoreKey[]
export const DEFAULT_RUBRIC: Record<ScoreKey, number> = {
  symptom_identification: 2, evidence_reasoning: 3, additional_checks: 2, safe_resolution: 2, verification_or_escalation: 1,
}
export const emptyForm = (): FormFields => ({ issue: '', hypothesis: '', evidence: '', nextCheck: '', action: '', verification: '', escalation: '' })
export const emptyChecks = (): ScoreChecks => ({ symptom_identification: false, evidence_reasoning: false, additional_checks: false, safe_resolution: false, verification_or_escalation: false })
export const emptyDraft = (): Draft => ({ form: emptyForm(), commands: [], hintViewed: false, answerRevealed: false, checks: emptyChecks() })
export const emptyExamDraft = (): ExamDraft => ({ form: { symptom: '', hypothesis: '', evidence: '', action: '', verification: '' }, commands: [] })
export const emptyProgress = (): Progress => ({ version: 5, drafts: {}, attempts: [], guidedDrafts: {}, guidedAttempts: [], reviewAttempts: [], examDrafts: {}, examAttempts: [], statefulDrafts: {}, statefulAttempts: [], objectiveExamDrafts: {}, objectiveExamAttempts: [] })

export function normalizeCommand(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}
export function matchProbe(probes: Probe[], input: string): Probe | undefined {
  return probes.find(probe => probe.available && normalizeCommand(probe.command) === normalizeCommand(input))
}
export function isInvestigation(command: string): boolean {
  return /^(PANEL|BILLING|BACKUP LOG):/i.test(command)
}
export function matchProbeForKind(probes: Probe[], input: string, kind: 'terminal' | 'investigation'): Probe | undefined {
  const probe = matchProbe(probes, input)
  return probe && isInvestigation(probe.command) === (kind === 'investigation') ? probe : undefined
}
export function scoreChecks(checks: ScoreChecks, rubric: Record<ScoreKey, number> = DEFAULT_RUBRIC): number {
  return SCORE_KEYS.reduce((total, key) => total + (checks[key] ? rubric[key] : 0), 0)
}
export function ticketStatus(id: string, progress: Progress): 'new' | 'started' | 'completed' {
  if (progress.attempts.some(attempt => attempt.ticketId === id) || progress.guidedAttempts.some(attempt => attempt.ticketId === id) || progress.examAttempts.some(attempt => attempt.ticketId === id) || progress.statefulAttempts.some(attempt => attempt.ticketId === id) || progress.objectiveExamAttempts.some(attempt => attempt.ticketId === id)) return 'completed'
  const draft = progress.drafts[id]
  const guided = progress.guidedDrafts[id]
  const exam = progress.examDrafts[id]
  const stateful = progress.statefulDrafts[id]
  const objective = progress.objectiveExamDrafts[id]
  if (stateful && (stateful.commands.length > 0 || stateful.actionId || stateful.note.trim())) return 'started'
  if (objective && (objective.commands.length > 0 || Object.keys(objective.responses).length > 0)) return 'started'
  if (exam && (exam.commands.length > 0 || Object.values(exam.form).some(value => value.trim()))) return 'started'
  if (guided && (guided.commands.length > 0 || guided.hintLevel > 0 || guided.note.trim() || Object.keys(guided.feedback).length > 0 || Object.keys(guided.responses).length > 0)) return 'started'
  if (draft && (draft.commands.length > 0 || draft.hintViewed || draft.answerRevealed || Object.values(draft.form).some(Boolean))) return 'started'
  return 'new'
}
export function filterTickets(tickets: Ticket[], filters: { topic: string; level: string; status: string; query: string }, progress: Progress): Ticket[] {
  const query = filters.query.trim().toLowerCase()
  return tickets.filter(ticket =>
    (filters.topic === 'all' || ticket.topic === filters.topic) &&
    (filters.level === 'all' || ticket.difficulty === Number(filters.level)) &&
    (filters.status === 'all' || ticketStatus(ticket.id, progress) === filters.status) &&
    (!query || `${ticket.id} ${ticket.customer_message} ${ticket.topic} ${ticket.topic_vi}`.toLowerCase().includes(query))
  )
}
export function customerSummary(message: string): string {
  return message.split(/\n\s*\n/).map(part => part.trim()).find(part => part && !/^(Hello Support Team|Please help|Thank you)/i.test(part)) ?? message.trim()
}
export function answerUrl(ticketId: string): string {
  return `${import.meta.env.BASE_URL}answers/${encodeURIComponent(ticketId)}.json`
}
export function hintUrl(ticketId: string): string {
  return `${import.meta.env.BASE_URL}hints/${encodeURIComponent(ticketId)}.json`
}
export function isAnswer(value: unknown): value is Answer {
  if (!value || typeof value !== 'object') return false
  const answer = value as Record<string, unknown>
  return ['expected_diagnosis', 'recommended_next_checks', 'resolution_guidance', 'verification', 'escalate_when', 'production_warning'].every(key => typeof answer[key] === 'string') &&
    !!answer.scoring_rubric && typeof answer.scoring_rubric === 'object' &&
    SCORE_KEYS.every(key => Number.isFinite((answer.scoring_rubric as Record<string, unknown>)[key]))
}
