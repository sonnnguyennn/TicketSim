import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import guidedPublic from '../data/guided-public.json'
import { emptyProgress } from '../lib'
import { loadProgress, migrateProgress, saveProgress, validProgress } from '../storage'
import { emptyObjectiveExamDraft, gradeObjectiveExam, objectiveExamQuestions, objectiveExamReady, objectiveExamRequiredProbeIds } from './objective'
import type { GuidedAnswerKey, GuidedCase } from './types'

const pilots = (guidedPublic as GuidedCase[]).filter(item => item.simulation)

describe('Objective Exam and v5 progress', () => {
  it('grades six authored choices, classifies errors, and never scores prose', () => {
    for (const guidedCase of pilots) {
      const draft = emptyObjectiveExamDraft()
      const questions = objectiveExamQuestions(guidedCase)
      expect(questions).toHaveLength(6)
      expect(objectiveExamReady(guidedCase, draft)).toBe(false)
      draft.commands = guidedCase.probes.slice(0, 2).map(probe => ({ id: probe.id, probeId: probe.id, command: probe.command, output: probe.output, supported: true, kind: 'terminal', at: '' }))
      const keys: Record<string, GuidedAnswerKey> = {}
      for (const question of questions) {
        const path = question.id === 'exam-verify' ? `public/objective-feedback/${guidedCase.id}/exam-verify.json` : `public/guided-feedback/${guidedCase.id}/${question.id}.json`
        keys[question.id] = JSON.parse(fs.readFileSync(path, 'utf8')) as GuidedAnswerKey
        draft.responses[question.id] = keys[question.id].correctIds
      }
      expect(objectiveExamReady(guidedCase, draft)).toBe(true)
      const full = gradeObjectiveExam(guidedCase, draft, keys, '2026-10-23T00:00:00Z', 'a')
      expect(full.score).toBe(6)
      draft.responses['decision'] = [questions.find(item => item.id === 'decision')!.options.find(option => !keys.decision.correctIds.includes(option.id))!.id]
      draft.responses['output'] = [questions.find(item => item.id === 'output')!.options.find(option => !keys.output.correctIds.includes(option.id))!.id]
      const wrong = gradeObjectiveExam(guidedCase, draft, keys, '2026-10-23T00:00:00Z', 'b')
      expect(wrong.score).toBe(4)
      expect(wrong.errors.map(item => item.category).sort()).toEqual(['missing_evidence', 'unsafe_action'])
      expect(wrong.errors.every(item => !!item.questionId)).toBe(true)
    }
  })
  it('grades fourteen additional evidence-rich cases without requiring a Stateful simulation', () => {
    const expanded = (guidedPublic as GuidedCase[]).filter(item => item.objectiveExam && !item.simulation)
    expect(expanded).toHaveLength(14)
    for (const guidedCase of expanded) {
      const required = objectiveExamRequiredProbeIds(guidedCase)
      expect(required.length).toBeGreaterThanOrEqual(4)
      const draft = emptyObjectiveExamDraft()
      const questions = objectiveExamQuestions(guidedCase)
      expect(questions).toHaveLength(6)
      const keys: Record<string, GuidedAnswerKey> = {}
      for (const question of questions) {
        const path = question.id === 'exam-verify' ? `public/objective-feedback/${guidedCase.id}/exam-verify.json` : `public/guided-feedback/${guidedCase.id}/${question.id}.json`
        keys[question.id] = JSON.parse(fs.readFileSync(path, 'utf8')) as GuidedAnswerKey
        draft.responses[question.id] = keys[question.id].correctIds
      }
      draft.commands = guidedCase.probes.filter(probe => required.includes(probe.id) && probe.id !== required.at(-1)).map(probe => ({ id: probe.id, probeId: probe.id, command: probe.command, output: probe.output, supported: true, kind: probe.context === 'panel' ? 'investigation' : 'terminal', at: '' }))
      expect(objectiveExamReady(guidedCase, draft), guidedCase.id).toBe(false)
      const finalProbe = guidedCase.probes.find(probe => probe.id === required.at(-1))!
      draft.commands.push({ id: finalProbe.id, probeId: finalProbe.id, command: finalProbe.command, output: finalProbe.output, supported: true, kind: finalProbe.context === 'panel' ? 'investigation' : 'terminal', at: '' })
      expect(objectiveExamReady(guidedCase, draft), guidedCase.id).toBe(true)
      expect(gradeObjectiveExam(guidedCase, draft, keys, '2026-10-23T00:00:00Z', 'full').score).toBe(6)
      const wrongId = questions[4].options.find(option => !keys[questions[4].id].correctIds.includes(option.id))!.id
      draft.responses[questions[4].id] = [wrongId]
      const wrong = gradeObjectiveExam(guidedCase, draft, keys, '2026-10-23T00:00:00Z', 'wrong')
      expect(wrong.score).toBe(5)
      expect(wrong.errors).toHaveLength(1)
      expect(wrong.errors[0].category).toBe('unsafe_action')
    }
  })
  it('migrates v4 without dropping history and round trips stateful/objective drafts', () => {
    const { statefulDrafts: _statefulDrafts, statefulAttempts: _statefulAttempts, objectiveExamDrafts: _objectiveExamDrafts, objectiveExamAttempts: _objectiveExamAttempts, version: _version, ...legacyFields } = emptyProgress()
    const old = { ...legacyFields, version: 4 }
    const migrated = migrateProgress(old)
    expect(migrated?.version).toBe(5)
    expect(migrated?.guidedAttempts).toEqual(old.guidedAttempts)
    const progress = emptyProgress()
    progress.statefulDrafts['VPS-01-001'] = { state: 'changed', commands: [{ id: 'p', probeId: 'G3', command: 'systemctl status sshd', output: 'Active: active (running)', supported: true, kind: 'terminal', at: '2026-10-23', state: 'changed' }], actionId: 'start', approval: true, note: 'Cần xác minh từ client.', completed: false, errors: [{ category: 'missing_evidence', detail: 'Cần P1/P2.', at: '2026-10-23' }] }
    progress.objectiveExamDrafts['VPS-01-001'] = { responses: { triage: ['refused'] }, commands: [] }
    expect(validProgress(progress)).toBe(true)
    const map = new Map<string, string>()
    expect(saveProgress(progress, { setItem: (key, value) => { map.set(key, value) } })).toBe(true)
    expect(loadProgress({ getItem: key => map.get(key) ?? null })).toEqual(progress)
    expect(map.has('vps-ticket-simulator-progress-v5')).toBe(true)
  })
})
