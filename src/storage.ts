import { emptyProgress } from './lib'
import tickets from './data/tickets-public.json'
import type { LegacyProgress, Progress } from './types'

const KEY_V1 = 'vps-ticket-simulator-progress-v1'
const KEY_V2 = 'vps-ticket-simulator-progress-v2'
const KEY_V3 = 'vps-ticket-simulator-progress-v3'
const KEY_V4 = 'vps-ticket-simulator-progress-v4'
const KEY_V5 = 'vps-ticket-simulator-progress-v5'
const FORM_KEYS = ['issue', 'hypothesis', 'evidence', 'nextCheck', 'action', 'verification', 'escalation']
const CHECK_KEYS = ['symptom_identification', 'evidence_reasoning', 'additional_checks', 'safe_resolution', 'verification_or_escalation']
const ticketIds = new Set(tickets.map(ticket => ticket.id))
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const validForm = (value: unknown) => isRecord(value) && FORM_KEYS.every(key => typeof value[key] === 'string')
const validChecks = (value: unknown) => isRecord(value) && CHECK_KEYS.every(key => typeof value[key] === 'boolean')
const validCommands = (value: unknown) => Array.isArray(value) && value.every(entry => isRecord(entry) && typeof entry.id === 'string' && typeof entry.command === 'string' && typeof entry.output === 'string' && typeof entry.at === 'string' && typeof entry.supported === 'boolean' && (entry.probeId === undefined || typeof entry.probeId === 'string') && (entry.state === undefined || typeof entry.state === 'string') && (entry.kind === 'terminal' || entry.kind === 'investigation'))
const validResponses = (value: unknown) => isRecord(value) && Object.values(value).every(answer => Array.isArray(answer) && answer.every(item => typeof item === 'string'))
const validFeedback = (value: unknown) => isRecord(value) && Object.values(value).every(item => isRecord(item) && typeof item.correct === 'boolean' && Array.isArray(item.correctIds) && item.correctIds.every(id => typeof id === 'string') && typeof item.explanation === 'string' && isRecord(item.optionFeedback) && Object.values(item.optionFeedback).every(text => typeof text === 'string') && (item.commandId === undefined || typeof item.commandId === 'string'))
const validGuidedDraft = (value: unknown) => isRecord(value) && Number.isInteger(value.stage) && Number(value.stage) >= 0 && Number(value.stage) <= 4 && validResponses(value.responses) && validFeedback(value.feedback) && validCommands(value.commands) && (value.commandInput === undefined || typeof value.commandInput === 'string') && Number.isInteger(value.hintLevel) && Number(value.hintLevel) >= 0 && Number(value.hintLevel) <= 3 && typeof value.note === 'string' && typeof value.submitted === 'boolean'
const validOutcomes = (value: unknown) => isRecord(value) && Object.values(value).every(result => typeof result === 'boolean')
const validGuidedAttempt = (value: unknown) => isRecord(value) && typeof value.id === 'string' && ticketIds.has(String(value.ticketId)) && typeof value.createdAt === 'string' && validResponses(value.responses) && validCommands(value.commands) && Number.isInteger(value.hintLevel) && Number(value.hintLevel) >= 0 && Number(value.hintLevel) <= 3 && typeof value.note === 'string' && Number.isInteger(value.score) && Number.isInteger(value.total) && Number(value.score) >= 0 && Number(value.total) > 0 && Number(value.score) <= Number(value.total) && typeof value.independent === 'boolean' && (value.outcomes === undefined || validOutcomes(value.outcomes))
const validReviewAttempt = (value: unknown) => isRecord(value) && typeof value.id === 'string' && ticketIds.has(String(value.ticketId)) && typeof value.createdAt === 'string' && typeof value.sourceAttemptId === 'string' && (value.kind === 'mistakes' || value.kind === 'retest') && (value.variantId === undefined || typeof value.variantId === 'string') && Array.isArray(value.questionIds) && value.questionIds.length > 0 && value.questionIds.every(id => typeof id === 'string') && validResponses(value.responses) && isRecord(value.outcomes) && validOutcomes(value.outcomes) && value.questionIds.every(id => typeof (value.outcomes as Record<string, unknown>)[id] === 'boolean')
const EXAM_KEYS = ['symptom', 'hypothesis', 'evidence', 'action', 'verification']
const validExamForm = (value: unknown) => isRecord(value) && EXAM_KEYS.every(key => typeof value[key] === 'string')
const validExamDraft = (value: unknown) => isRecord(value) && validExamForm(value.form) && validCommands(value.commands) && (value.submittedAttemptId === undefined || typeof value.submittedAttemptId === 'string')
const validExamAttempt = (value: unknown) => isRecord(value) && typeof value.id === 'string' && ticketIds.has(String(value.ticketId)) && typeof value.createdAt === 'string' && validExamForm(value.form) && validCommands(value.commands) && (value.checks === undefined || validChecks(value.checks)) && (value.selfScore === undefined || typeof value.selfScore === 'number' && Number.isFinite(value.selfScore) && value.selfScore >= 0 && value.selfScore <= 10)

function validLegacyCore(value: Record<string, unknown>): boolean {
  return isRecord(value.drafts) && Array.isArray(value.attempts) &&
    Object.entries(value.drafts).every(([id, draft]) => ticketIds.has(id) && isRecord(draft) && (draft.roundId === undefined || typeof draft.roundId === 'string') && validForm(draft.form) && validCommands(draft.commands) && validChecks(draft.checks) && typeof draft.hintViewed === 'boolean' && typeof draft.answerRevealed === 'boolean') &&
    value.attempts.every(attempt => isRecord(attempt) && typeof attempt.id === 'string' && ticketIds.has(String(attempt.ticketId)) && typeof attempt.createdAt === 'string' && (attempt.roundId === undefined || typeof attempt.roundId === 'string') && typeof attempt.hintViewed === 'boolean' && typeof attempt.selfScore === 'number' && Number.isFinite(attempt.selfScore) && attempt.selfScore >= 0 && attempt.selfScore <= 10 && validForm(attempt.form) && validCommands(attempt.commands) && validChecks(attempt.checks))
}

const validGuidedCore = (value: Record<string, unknown>) => isRecord(value.guidedDrafts) && Array.isArray(value.guidedAttempts) &&
  Object.entries(value.guidedDrafts).every(([id, draft]) => ticketIds.has(id) && validGuidedDraft(draft)) && value.guidedAttempts.every(validGuidedAttempt)
const validReviewCore = (value: Record<string, unknown>) => Array.isArray(value.reviewAttempts) && value.reviewAttempts.every(validReviewAttempt)

function validV4(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && (value.version === 4 || value.version === 5) && validLegacyCore(value) && validGuidedCore(value) && validReviewCore(value) &&
    isRecord(value.examDrafts) && Object.entries(value.examDrafts).every(([id, draft]) => ticketIds.has(id) && validExamDraft(draft)) &&
    Array.isArray(value.examAttempts) && value.examAttempts.every(validExamAttempt) &&
    Object.entries(value.examDrafts).every(([id, draft]) => isRecord(draft) && (!draft.submittedAttemptId || (value.examAttempts as unknown[]).some(attempt => isRecord(attempt) && attempt.id === draft.submittedAttemptId && attempt.ticketId === id)))
}

const validErrors = (value: unknown) => Array.isArray(value) && value.every(item => isRecord(item) && ['knowledge', 'missing_evidence', 'unsafe_action'].includes(String(item.category)) && typeof item.detail === 'string' && typeof item.at === 'string' && (item.questionId === undefined || typeof item.questionId === 'string'))
const validStatefulDraft = (value: unknown) => isRecord(value) && typeof value.state === 'string' && validCommands(value.commands) && (value.actionId === undefined || typeof value.actionId === 'string') && (value.actionOutput === undefined || typeof value.actionOutput === 'string') && (value.actionFeedback === undefined || typeof value.actionFeedback === 'string') && typeof value.approval === 'boolean' && typeof value.note === 'string' && typeof value.completed === 'boolean' && validErrors(value.errors)
const validStatefulAttempt = (value: unknown) => isRecord(value) && typeof value.id === 'string' && ticketIds.has(String(value.ticketId)) && typeof value.createdAt === 'string' && typeof value.state === 'string' && validCommands(value.commands) && (value.actionId === undefined || typeof value.actionId === 'string') && typeof value.note === 'string' && validErrors(value.errors)
const validObjectiveDraft = (value: unknown) => isRecord(value) && validResponses(value.responses) && validCommands(value.commands) && (value.submittedAttemptId === undefined || typeof value.submittedAttemptId === 'string')
const validObjectiveAttempt = (value: unknown) => isRecord(value) && typeof value.id === 'string' && ticketIds.has(String(value.ticketId)) && typeof value.createdAt === 'string' && validResponses(value.responses) && validCommands(value.commands) && validOutcomes(value.outcomes) && Number.isInteger(value.score) && Number.isInteger(value.total) && Number(value.score) >= 0 && Number(value.total) > 0 && Number(value.score) <= Number(value.total) && validErrors(value.errors)

export function validProgress(value: unknown): value is Progress {
  return validV4(value) && value.version === 5 && (value.supportLevel === undefined || typeof value.supportLevel === 'string' && ['beginner', 'normal', 'independent'].includes(value.supportLevel)) && isRecord(value.statefulDrafts) && Object.entries(value.statefulDrafts).every(([id, draft]) => ticketIds.has(id) && validStatefulDraft(draft)) && Array.isArray(value.statefulAttempts) && value.statefulAttempts.every(validStatefulAttempt) && isRecord(value.objectiveExamDrafts) && Object.entries(value.objectiveExamDrafts).every(([id, draft]) => ticketIds.has(id) && validObjectiveDraft(draft)) && Array.isArray(value.objectiveExamAttempts) && value.objectiveExamAttempts.every(validObjectiveAttempt) && Object.entries(value.objectiveExamDrafts).every(([id, draft]) => isRecord(draft) && (!draft.submittedAttemptId || (value.objectiveExamAttempts as unknown[]).some(attempt => isRecord(attempt) && attempt.id === draft.submittedAttemptId && attempt.ticketId === id)))
}

export function migrateProgress(value: unknown): Progress | null {
  if (validProgress(value)) return value
  if (!isRecord(value) || !validLegacyCore(value)) return null
  if (value.version === 4 && validV4(value)) return { version: 5, drafts: value.drafts as Progress['drafts'], attempts: value.attempts as Progress['attempts'], guidedDrafts: value.guidedDrafts as Progress['guidedDrafts'], guidedAttempts: value.guidedAttempts as Progress['guidedAttempts'], reviewAttempts: value.reviewAttempts as Progress['reviewAttempts'], examDrafts: value.examDrafts as Progress['examDrafts'], examAttempts: value.examAttempts as Progress['examAttempts'], statefulDrafts: {}, statefulAttempts: [], objectiveExamDrafts: {}, objectiveExamAttempts: [] }
  if (value.version === 3 && validGuidedCore(value) && validReviewCore(value)) {
    return { version: 5, drafts: value.drafts as Progress['drafts'], attempts: value.attempts as Progress['attempts'], guidedDrafts: value.guidedDrafts as Progress['guidedDrafts'], guidedAttempts: value.guidedAttempts as Progress['guidedAttempts'], reviewAttempts: value.reviewAttempts as Progress['reviewAttempts'], examDrafts: {}, examAttempts: [], statefulDrafts: {}, statefulAttempts: [], objectiveExamDrafts: {}, objectiveExamAttempts: [] }
  }
  if (value.version === 2 && validGuidedCore(value)) {
    return { version: 5, drafts: value.drafts as Progress['drafts'], attempts: value.attempts as Progress['attempts'], guidedDrafts: value.guidedDrafts as Progress['guidedDrafts'], guidedAttempts: value.guidedAttempts as Progress['guidedAttempts'], reviewAttempts: [], examDrafts: {}, examAttempts: [], statefulDrafts: {}, statefulAttempts: [], objectiveExamDrafts: {}, objectiveExamAttempts: [] }
  }
  if (value.version !== 1) return null
  const legacy = value as LegacyProgress
  return { version: 5, drafts: legacy.drafts, attempts: legacy.attempts, guidedDrafts: {}, guidedAttempts: [], reviewAttempts: [], examDrafts: {}, examAttempts: [], statefulDrafts: {}, statefulAttempts: [], objectiveExamDrafts: {}, objectiveExamAttempts: [] }
}

export function loadProgress(storage: Pick<Storage, 'getItem'> = localStorage): Progress {
  try {
    const fifth = storage.getItem(KEY_V5)
    if (fifth) { try { const parsed = migrateProgress(JSON.parse(fifth)); if (parsed) return parsed } catch { /* Preserve older snapshots. */ } }
    const current = storage.getItem(KEY_V4)
    if (current) {
      try {
        const parsed = migrateProgress(JSON.parse(current))
        if (parsed) return parsed
      } catch { /* Fall back to the preserved older snapshots. */ }
    }
    const third = storage.getItem(KEY_V3)
    if (third) {
      try { const migrated = migrateProgress(JSON.parse(third)); if (migrated) return migrated } catch { /* Keep looking for v2. */ }
    }
    const previous = storage.getItem(KEY_V2)
    if (previous) {
      try { const migrated = migrateProgress(JSON.parse(previous)); if (migrated) return migrated } catch { /* Keep looking for v1. */ }
    }
    const legacy = storage.getItem(KEY_V1)
    return legacy ? migrateProgress(JSON.parse(legacy)) ?? emptyProgress() : emptyProgress()
  } catch { return emptyProgress() }
}

export function saveProgress(progress: Progress, storage: Pick<Storage, 'setItem'> = localStorage): boolean {
  try { storage.setItem(KEY_V5, JSON.stringify(progress)); return true } catch { return false }
}

export function clearProgress(storage: Pick<Storage, 'removeItem'> = localStorage): void {
  storage.removeItem(KEY_V5)
  storage.removeItem(KEY_V4)
  storage.removeItem(KEY_V3)
  storage.removeItem(KEY_V2)
  storage.removeItem(KEY_V1)
}
