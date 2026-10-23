import type { GuidedAttempt, Progress } from '../types'
import type { GuidedCase } from './types'

export const objectiveQuestions = (guidedCase: GuidedCase) => guidedCase.questions.filter(question => question.kind !== 'short_answer')
export const latestGuidedAttempt = (progress: Progress, ticketId: string): GuidedAttempt | undefined => progress.guidedAttempts.filter(item => item.ticketId === ticketId).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0]

export function mistakeStats(progress: Progress, cases: GuidedCase[]): { byQuestion: Record<string, number>; bySkill: Record<string, number> } {
  const byQuestion: Record<string, number> = {}
  const bySkill: Record<string, number> = {}
  for (const guidedCase of cases) {
    const questions = new Map(objectiveQuestions(guidedCase).map(question => [question.id, question]))
    const outcomes = [...progress.guidedAttempts.filter(item => item.ticketId === guidedCase.id).map(item => item.outcomes), ...progress.reviewAttempts.filter(item => item.ticketId === guidedCase.id).map(item => item.outcomes)]
    for (const recorded of outcomes) for (const [id, correct] of Object.entries(recorded ?? {})) {
      const question = questions.get(id)
      if (question && correct === false) { byQuestion[`${guidedCase.id}/${id}`] = (byQuestion[`${guidedCase.id}/${id}`] ?? 0) + 1; bySkill[question.skill ?? question.stage] = (bySkill[question.skill ?? question.stage] ?? 0) + 1 }
    }
  }
  return { byQuestion, bySkill }
}

export function mistakeIds(progress: Progress, guidedCase: GuidedCase): string[] {
  const attempt = latestGuidedAttempt(progress, guidedCase.id)
  if (!attempt?.outcomes) return []
  return objectiveQuestions(guidedCase).filter(question => {
    const latest = progress.reviewAttempts.filter(review => review.ticketId === guidedCase.id && review.sourceAttemptId === attempt.id && review.questionIds.includes(question.id)).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0]
    return (latest?.outcomes[question.id] ?? attempt.outcomes?.[question.id]) === false
  }).map(question => question.id)
}

export function isRetestDue(progress: Progress, guidedCase: GuidedCase, now = Date.now()): boolean {
  const source = latestGuidedAttempt(progress, guidedCase.id)
  return !!source && Number.isFinite(Date.parse(source.createdAt)) && now - Date.parse(source.createdAt) >= 24 * 60 * 60 * 1000 && !isMastered(progress, guidedCase)
}

export function isMastered(progress: Progress, guidedCase: GuidedCase): boolean {
  const source = latestGuidedAttempt(progress, guidedCase.id)
  if (!source) return false
  const ids = objectiveQuestions(guidedCase).map(question => question.id)
  return progress.reviewAttempts.some(review => review.kind === 'retest' && !!review.variantId && guidedCase.reviewVariants?.includes(review.variantId) && review.ticketId === guidedCase.id && review.sourceAttemptId === source.id && Date.parse(review.createdAt) - Date.parse(source.createdAt) >= 24 * 60 * 60 * 1000 && ids.length === review.questionIds.length && ids.every(id => review.questionIds.includes(id) && review.outcomes[id] === true))
}
