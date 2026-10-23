import type { LearningError, ObjectiveExamAttempt, ObjectiveExamDraft } from '../types'
import { gradeSelection } from './engine'
import type { GuidedAnswerKey, GuidedCase, GuidedQuestion } from './types'

export const emptyObjectiveExamDraft = (): ObjectiveExamDraft => ({ responses: {}, commands: [] })
export function objectiveExamQuestions(guidedCase: GuidedCase): GuidedQuestion[] {
  if (!guidedCase.simulation || !guidedCase.objectiveExam) return []
  return [...['triage', 'check', 'output', 'evidence', 'decision'].map(id => guidedCase.questions.find(question => question.id === id)).filter((question): question is GuidedQuestion => !!question), guidedCase.objectiveExam]
}
export function objectiveExamReady(guidedCase: GuidedCase, draft: ObjectiveExamDraft): boolean {
  const questions = objectiveExamQuestions(guidedCase)
  return questions.length === 6 && ['P1', 'P2'].every(id => draft.commands.some(entry => entry.supported && entry.probeId === id)) && questions.every(question => (draft.responses[question.id] ?? []).length > 0)
}
export function gradeObjectiveExam(guidedCase: GuidedCase, draft: ObjectiveExamDraft, keys: Record<string, GuidedAnswerKey>, createdAt: string, id: string): ObjectiveExamAttempt {
  if (!objectiveExamReady(guidedCase, draft)) throw new Error('Cần đọc P1/P2 và trả lời đủ sáu câu.')
  const questions = objectiveExamQuestions(guidedCase)
  const outcomes: Record<string, boolean> = {}
  const errors: LearningError[] = []
  for (const question of questions) {
    const key = keys[question.id]
    if (!key || !Array.isArray(key.correctIds) || key.correctIds.some(option => !question.options.some(item => item.id === option)) || typeof key.explanation !== 'string') throw new Error(`Đáp án không hợp lệ: ${question.id}`)
    const correct = gradeSelection(draft.responses[question.id], key, question.kind === 'step_order' ? 'step_order' : 'selection')
    outcomes[question.id] = correct
    if (!correct) errors.push({ questionId: question.id, category: question.stage === 'interpret' || question.stage === 'verify' ? 'missing_evidence' : question.stage === 'decide' ? 'unsafe_action' : 'knowledge', detail: `${question.prompt} ${key.explanation}`, at: createdAt })
  }
  return { id, ticketId: guidedCase.id, createdAt, responses: structuredClone(draft.responses), commands: [...draft.commands], outcomes, score: Object.values(outcomes).filter(Boolean).length, total: questions.length, errors }
}
