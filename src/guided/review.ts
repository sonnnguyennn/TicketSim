import type { GuidedAttempt, Progress } from '../types'
import type { GuidedCase } from './types'

export const objectiveQuestions = (guidedCase: GuidedCase) => guidedCase.questions.filter(question => question.kind !== 'short_answer')
export const latestGuidedAttempt = (progress: Progress, ticketId: string): GuidedAttempt | undefined => progress.guidedAttempts.filter(item => item.ticketId === ticketId).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0]

export function mistakeStats(progress: Progress, cases: GuidedCase[]): { byQuestion: Record<string, number>; bySkill: Record<string, number> } {
  const byQuestion: Record<string, number> = {}
  const bySkill: Record<string, number> = {}
  for (const guidedCase of cases) {
    const questions = new Map([...objectiveQuestions(guidedCase), ...(guidedCase.reviewVariants ?? []).flatMap(variant => variant.questions)].map(question => [question.id, question]))
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

export type KnowledgeWeakness = { skill: string; count: number; ticketId: string; mode: 'guided' | 'ticket' | 'objective' | 'stateful'; questionIds: string[] }
export function knowledgeQueue(progress: Progress, cases: GuidedCase[]): KnowledgeWeakness[] {
  const grouped = new Map<string, KnowledgeWeakness>()
  const add = (skill: string, ticketId: string, mode: KnowledgeWeakness['mode'], questionId?: string) => {
    const current = grouped.get(skill) ?? { skill, count: 0, ticketId, mode, questionIds: [] }
    current.count += 1
    if (mode === 'guided' && current.mode !== 'guided') { current.ticketId = ticketId; current.mode = mode; current.questionIds = [] }
    if (mode === current.mode && current.ticketId === ticketId && questionId && !current.questionIds.includes(questionId)) current.questionIds.push(questionId)
    grouped.set(skill, current)
  }
  for (const guidedCase of cases) {
    for (const id of mistakeIds(progress, guidedCase)) {
      const question = guidedCase.questions.find(item => item.id === id)
      if (question) add(question.skill ?? question.stage, guidedCase.id, 'guided', id)
    }
    const latestVariant = progress.reviewAttempts.filter(item => item.ticketId === guidedCase.id && item.kind === 'retest' && !!item.variantId).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0]
    const variant = guidedCase.reviewVariants?.find(item => item.id === latestVariant?.variantId)
    if (variant && !isMastered(progress, guidedCase)) for (const question of variant.questions) if (latestVariant.outcomes[question.id] === false) add(question.skill ?? question.stage, guidedCase.id, 'ticket')
    const objective = progress.objectiveExamAttempts.filter(item => item.ticketId === guidedCase.id).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0]
    for (const error of objective?.errors ?? []) {
      const question = [...guidedCase.questions, ...(guidedCase.objectiveExam ? [guidedCase.objectiveExam] : [])].find(item => item.id === error.questionId)
      add(question?.skill ?? question?.stage ?? error.category, guidedCase.id, 'objective')
    }
    const draft = progress.statefulDrafts[guidedCase.id]
    const stateful = progress.statefulAttempts.filter(item => item.ticketId === guidedCase.id).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0]
    for (const error of draft && !draft.completed ? draft.errors : stateful?.errors ?? []) add(error.category === 'missing_evidence' ? 'investigate' : error.category === 'unsafe_action' ? 'decide' : 'interpret', guidedCase.id, 'stateful')
  }
  return [...grouped.values()].sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill))
}

export function isRetestDue(progress: Progress, guidedCase: GuidedCase, now = Date.now()): boolean {
  const source = latestGuidedAttempt(progress, guidedCase.id)
  const unusedVariant = guidedCase.reviewVariants?.some(variant => !progress.reviewAttempts.some(review => review.ticketId === guidedCase.id && review.variantId === variant.id && review.kind === 'retest'))
  return !!source && !!unusedVariant && Number.isFinite(Date.parse(source.createdAt)) && now - Date.parse(source.createdAt) >= 24 * 60 * 60 * 1000 && !isMastered(progress, guidedCase)
}

export function isMastered(progress: Progress, guidedCase: GuidedCase): boolean {
  const source = latestGuidedAttempt(progress, guidedCase.id)
  if (!source) return false
  return progress.reviewAttempts.some(review => {
    const variant = guidedCase.reviewVariants?.find(item => item.id === review.variantId)
    const elapsed = Date.parse(review.createdAt) - Date.parse(source.createdAt)
    if (review.kind !== 'retest' || !variant || review.ticketId !== guidedCase.id || review.sourceAttemptId !== source.id || !Number.isFinite(elapsed) || elapsed < 24 * 60 * 60 * 1000) return false
    const firstUse = progress.reviewAttempts.filter(other => other.ticketId === guidedCase.id && other.kind === 'retest' && other.variantId === variant.id).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id))[0]
    if (firstUse?.id !== review.id) return false
    const ids = variant.questions.map(question => question.id)
    return ids.length === review.questionIds.length && ids.every(id => review.questionIds.includes(id) && review.outcomes[id] === true)
  })
}
