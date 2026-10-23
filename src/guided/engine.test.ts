import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import guidedPublic from '../data/guided-public.json'
import { commandLibrary } from './commands'
import { classifyGuidedCommand, emptyGuidedDraft, gradeSelection, objectiveScore, stageComplete } from './engine'
import { isMastered, isRetestDue, knowledgeQueue, mistakeIds, mistakeStats, objectiveQuestions } from './review'
import { emptyProgress } from '../lib'
import type { GuidedCase } from './types'

const cases = guidedPublic as GuidedCase[]

describe('Guided content', () => {
  it('provides eighty-eight Guided cases without answer keys in the initial payload', () => {
    expect(cases).toHaveLength(88)
    expect(new Set(cases.map(item => item.id)).size).toBe(88)
    expect(cases.filter(item => ['VPS-01-003', 'VPS-03-003', 'VPS-05-004', 'VPS-08-003'].includes(item.id))).toHaveLength(4)
    for (const item of cases) {
      expect(item.probes.length).toBeGreaterThanOrEqual(2)
      const original = (JSON.parse(fs.readFileSync('starter-data/tickets.json', 'utf8')).tickets as { id: string; probe_outputs: { stdout: string }[] }[]).find(ticket => ticket.id === item.id)!
      if (item.id === 'VPS-05-008') expect(item.probes[0].output).toContain('vgdata-lvdata 30G')
      else if (item.id === 'VPS-10-008') expect(item.probes[0].output).toContain('System clock synchronized: no')
      else if (['VPS-09-001', 'VPS-09-007', 'VPS-13-005', 'VPS-13-007'].includes(item.id)) expect(item.probes[0].output).not.toBe(original.probe_outputs[0].stdout)
      else expect(item.probes[0].output).toBe(original.probe_outputs[0].stdout)
      if (item.id === 'VPS-07-007') {
        expect(original.probe_outputs[1].stdout).toBe('server_name shop.example.com missing')
        expect(item.probes[1].output).toContain('# configuration file /etc/nginx/conf.d/api.conf:')
        expect(item.probes[1].output).not.toContain('missing')
      } else if (item.id === 'VPS-07-003') {
        expect(item.probes[1].output).toContain('root /var/www/html;')
        expect(item.probes[1].output).not.toContain('intended deploy')
      } else if (item.id === 'VPS-08-006') {
        expect(item.probes[1].output).toBe('2001:db8:bad::20')
        expect(item.probes[1].output).not.toContain('PANEL:')
      } else if (item.id === 'VPS-05-008') expect(item.probes[1].output).toContain('49.99g')
      else if (item.id === 'VPS-06-002') expect(item.probes[1].output).toContain('mariabackup')
      else if (item.id === 'VPS-10-005') expect(item.probes[1].output).not.toContain('(no vdb)')
      else if (item.id === 'VPS-10-006') expect(item.probes[1].output).not.toContain('expected')
      else if (item.id === 'VPS-10-008') expect(item.probes[1].output).not.toContain('host is')
      else if (['VPS-09-001', 'VPS-09-002', 'VPS-09-003', 'VPS-09-004', 'VPS-09-005', 'VPS-09-007', 'VPS-09-008', 'VPS-13-002', 'VPS-13-003', 'VPS-13-004'].includes(item.id)) expect(item.probes[1].output).not.toBe(original.probe_outputs[1].stdout)
      else expect(item.probes[1].output).toBe(original.probe_outputs[1].stdout)
      expect(item.questions.filter(question => question.kind !== 'short_answer').length).toBeGreaterThanOrEqual(5)
      expect(item.questions.some(question => question.kind === 'short_answer')).toBe(true)
      expect(item.questions.every(question => !('correctIds' in question) && !('optionFeedback' in question))).toBe(true)
      expect(fs.readdirSync(`public/guided-feedback/${item.id}`).filter(name => name.endsWith('.json'))).toHaveLength(objectiveQuestions(item).length)
      expect(fs.existsSync(`public/guided-hints/${item.id}.json`)).toBe(true)
      for (const probe of item.probes) expect(commandLibrary.some(doc => doc.id === probe.commandId)).toBe(true)
      for (const question of objectiveQuestions(item)) {
        const key = JSON.parse(fs.readFileSync(`public/guided-feedback/${item.id}/${question.id}.json`, 'utf8'))
        expect(question.options.every(option => typeof key.optionFeedback[option.id] === 'string' && key.optionFeedback[option.id].length > 5)).toBe(true)
        expect(key.correctIds.every((id: string) => question.options.some(option => option.id === id))).toBe(true)
      }
      for (const variant of item.reviewVariants ?? []) for (const question of variant.questions) {
        expect('correctIds' in question).toBe(false)
        const key = JSON.parse(fs.readFileSync(`public/review-feedback/${item.id}/${variant.id}/${question.id}.json`, 'utf8'))
        expect(question.options.every(option => typeof key.optionFeedback[option.id] === 'string')).toBe(true)
        expect(key.correctIds.every((id: string) => question.options.some(option => option.id === id))).toBe(true)
      }
    }
    expect(commandLibrary.length).toBe(111)
    expect(new Set(commandLibrary.map(item => item.id)).size).toBe(commandLibrary.length)
    expect(commandLibrary.every(item => item.exampleOutput && item.whenToUse && item.followUp && item.flags && item.centos && item.ubuntu)).toBe(true)
    expect(cases.some(item => item.questions.some(question => question.kind === 'step_order'))).toBe(true)
    const added = cases.slice(12)
    expect(added).toHaveLength(76)
    const tickets = JSON.parse(fs.readFileSync('starter-data/tickets.json', 'utf8')).tickets as { id: string; topic: string; difficulty: number }[]
    expect(new Set(added.map(item => tickets.find(ticket => ticket.id === item.id)?.topic)).size).toBe(11)
    for (const item of added) {
      expect(item.questions.some(question => question.kind === 'multi_select')).toBe(true)
      expect(item.questions.some(question => question.kind === 'command_choice')).toBe(true)
      expect(item.questions.some(question => question.kind === 'output_interpretation')).toBe(true)
      const difficulty = tickets.find(ticket => ticket.id === item.id)!.difficulty
      if (difficulty >= 2) {
        expect(item.probes.length).toBeGreaterThanOrEqual(3)
        expect(item.questions.some(question => question.kind === 'step_order')).toBe(true)
        expect(item.questions.some(question => question.requiredProbeIds?.includes('G1'))).toBe(true)
        const order = item.questions.find(question => question.kind === 'step_order')!
        const orderKey = JSON.parse(fs.readFileSync(`public/guided-feedback/${item.id}/${order.id}.json`, 'utf8'))
        expect(gradeSelection(order.options.map(option => option.id).reverse(), orderKey, 'step_order')).toBe(false)
      }
      for (const question of objectiveQuestions(item)) {
        const key = JSON.parse(fs.readFileSync(`public/guided-feedback/${item.id}/${question.id}.json`, 'utf8'))
        expect(gradeSelection(key.correctIds, key, question.kind === 'step_order' ? 'step_order' : 'selection')).toBe(true)
        const incorrect = question.kind === 'step_order' ? [...key.correctIds].reverse() : [question.options.find(option => !key.correctIds.includes(option.id))!.id]
        expect(gradeSelection(incorrect, key, question.kind === 'step_order' ? 'step_order' : 'selection')).toBe(false)
      }
    }
  })
  it('keeps exact probe output and vetted sudo alias, without inventing output for other commands', () => {
    const pilot = cases.find(item => item.id === 'VPS-01-001')!
    const alias = classifyGuidedCommand('  sudo  systemctl status sshd ', pilot.probes, commandLibrary)
    expect(alias.kind).toBe('available')
    if (alias.kind === 'available') expect(alias.probe.output).toBe('Active: inactive (dead)')
    expect(classifyGuidedCommand('ip route', pilot.probes, commandLibrary).kind).toBe('known')
    expect(classifyGuidedCommand('systemctl restart sshd', pilot.probes, commandLibrary).kind).toBe('restricted')
    expect(classifyGuidedCommand('rm -rf /var/log', pilot.probes, commandLibrary).kind).toBe('restricted')
    expect(classifyGuidedCommand('nonsense command', pilot.probes, commandLibrary).kind).toBe('unclear')
    for (const item of cases) for (const probe of item.probes) {
      const match = classifyGuidedCommand(probe.command, item.probes, commandLibrary, probe.requiredState?.[0] ?? 'initial')
      expect(match.kind).toBe('available')
      if (match.kind === 'available') expect(match.probe.output).toBe(probe.output)
    }
    const afterFix = { ...pilot.probes[0], id: 'after-fix', output: 'Active: active (running)', requiredState: ['afterFix'] }
    const staged = [afterFix, ...pilot.probes]
    const initial = classifyGuidedCommand('systemctl status sshd', staged, commandLibrary)
    const later = classifyGuidedCommand('systemctl status sshd', staged, commandLibrary, 'afterFix')
    expect(initial.kind).toBe('available')
    expect(later.kind).toBe('available')
    if (initial.kind === 'available' && later.kind === 'available') { expect(initial.probe.output).toBe('Active: inactive (dead)'); expect(later.probe.output).toBe('Active: active (running)') }
  })
  it('grades selected options and requires evidence probes before interpretation', () => {
    const pilot = cases[0]
    const key = JSON.parse(fs.readFileSync('public/guided-feedback/VPS-01-001/evidence.json', 'utf8'))
    expect(gradeSelection(['inactive', 'noport'], key)).toBe(true)
    expect(gradeSelection(['inactive'], key)).toBe(false)
    expect(gradeSelection(['inactive', 'inactive'], key)).toBe(false)
    const draft = emptyGuidedDraft()
    draft.feedback.check = { correct: true, correctIds: ['service'], explanation: '', optionFeedback: {} }
    draft.commands.push({ id: '1', probeId: 'P1', command: 'systemctl status sshd', output: 'Active: inactive (dead)', supported: true, kind: 'terminal', at: '' })
    expect(stageComplete(pilot, 'investigate', draft)).toBe(false)
    draft.commands.push({ id: '2', probeId: 'P2', command: 'ss -ltnp', output: 'No listener on :22', supported: true, kind: 'terminal', at: '' })
    expect(stageComplete(pilot, 'investigate', draft)).toBe(true)
    draft.note = 'ok'
    expect(stageComplete(pilot, 'verify', draft)).toBe(false)
    draft.note = 'Đã ghi bằng chứng và bước xác minh tiếp theo.'
    expect(stageComplete(pilot, 'verify', draft)).toBe(true)
    expect(objectiveScore(pilot, draft)).toEqual({ score: 1, total: 6 })
    const sequence = JSON.parse(fs.readFileSync('public/guided-feedback/VPS-01-001/sequence.json', 'utf8'))
    expect(gradeSelection(sequence.correctIds, sequence, 'step_order')).toBe(true)
    expect(gradeSelection([...sequence.correctIds].reverse(), sequence, 'step_order')).toBe(false)
  })
  it('can complete every authored Guided path with exact fixture evidence and its own answer keys', () => {
    for (const guidedCase of cases) {
      const draft = emptyGuidedDraft()
      draft.commands = guidedCase.probes.filter(probe => !probe.requiredState || probe.requiredState.includes('initial')).map(probe => ({ id: probe.id, probeId: probe.id, command: probe.command, output: probe.output, supported: true, kind: probe.context === 'panel' ? 'investigation' : 'terminal', at: '' }))
      for (const question of objectiveQuestions(guidedCase)) {
        const key = JSON.parse(fs.readFileSync(`public/guided-feedback/${guidedCase.id}/${question.id}.json`, 'utf8'))
        draft.responses[question.id] = key.correctIds
        draft.feedback[question.id] = { ...key, correct: gradeSelection(key.correctIds, key, question.kind === 'step_order' ? 'step_order' : 'selection') }
      }
      draft.note = 'Đã ghi triệu chứng, bằng chứng và bước xác minh an toàn tiếp theo.'
      for (const stage of ['triage', 'investigate', 'interpret', 'decide', 'verify'] as const) expect(stageComplete(guidedCase, stage, draft), `${guidedCase.id}/${stage}`).toBe(true)
      expect(objectiveScore(guidedCase, draft)).toEqual({ score: objectiveQuestions(guidedCase).length, total: objectiveQuestions(guidedCase).length })
    }
  })
  it('tracks mistakes and requires a delayed full independent retest for mastery', () => {
    const guidedCase = cases[0]
    const source = { id: 'guided-1', ticketId: guidedCase.id, createdAt: '2026-10-20T00:00:00.000Z', responses: {}, commands: [], hintLevel: 0, note: 'A complete note', score: 5, total: 6, independent: false, outcomes: Object.fromEntries(objectiveQuestions(guidedCase).map(question => [question.id, question.id !== 'output'])) }
    const progress = { ...emptyProgress(), guidedAttempts: [source] }
    expect(mistakeIds(progress, guidedCase)).toEqual(['output'])
    expect(mistakeStats(progress, cases).byQuestion[`${guidedCase.id}/output`]).toBe(1)
    expect(isRetestDue(progress, guidedCase, Date.parse('2026-10-20T23:59:00Z'))).toBe(false)
    expect(isRetestDue(progress, guidedCase, Date.parse('2026-10-21T00:00:00Z'))).toBe(true)
    expect(isMastered(progress, guidedCase)).toBe(false)
    progress.reviewAttempts.push({ id: 'review-1', ticketId: guidedCase.id, sourceAttemptId: source.id, createdAt: '2026-10-20T12:00:00Z', kind: 'mistakes', questionIds: ['output'], responses: { output: ['stopped'] }, outcomes: { output: true } })
    expect(mistakeIds(progress, guidedCase)).toEqual([])
    expect(isMastered(progress, guidedCase)).toBe(false)
    const ids = objectiveQuestions(guidedCase).map(question => question.id)
    progress.reviewAttempts.push({ id: 'review-2', ticketId: guidedCase.id, sourceAttemptId: source.id, createdAt: '2026-10-21T01:00:00Z', kind: 'retest', questionIds: ids, responses: {}, outcomes: Object.fromEntries(ids.map(id => [id, true])) })
    expect(isMastered(progress, guidedCase)).toBe(false)
    const variant = guidedCase.reviewVariants?.[0]
    expect(variant).toBeDefined()
    const variantIds = variant!.questions.map(question => question.id)
    expect(variant!.questions.every(question => !guidedCase.questions.some(original => original.prompt === question.prompt))).toBe(true)
    progress.reviewAttempts.push({ id: 'review-too-early', ticketId: guidedCase.id, sourceAttemptId: source.id, createdAt: '2026-10-20T23:59:59Z', kind: 'retest', variantId: variant!.id, questionIds: variantIds, responses: {}, outcomes: Object.fromEntries(variantIds.map(id => [id, true])) })
    expect(isMastered(progress, guidedCase)).toBe(false)
    progress.reviewAttempts.push({ id: 'review-incomplete', ticketId: guidedCase.id, sourceAttemptId: source.id, createdAt: '2026-10-21T01:00:00Z', kind: 'retest', variantId: variant!.id, questionIds: variantIds, responses: {}, outcomes: Object.fromEntries(variantIds.map((id, index) => [id, index > 0])) })
    expect(isMastered(progress, guidedCase)).toBe(false)
    progress.reviewAttempts.push({ id: 'review-independent', ticketId: guidedCase.id, sourceAttemptId: source.id, createdAt: '2026-10-21T01:00:00Z', kind: 'retest', variantId: variant!.id, questionIds: variantIds, responses: {}, outcomes: Object.fromEntries(variantIds.map(id => [id, true])) })
    expect(isMastered(progress, guidedCase)).toBe(false)
    expect(isRetestDue(progress, guidedCase, Date.parse('2026-10-22T00:00:00Z'))).toBe(false)
    const firstTryCorrect = { ...progress, reviewAttempts: progress.reviewAttempts.filter(review => review.id !== 'review-incomplete' && review.id !== 'review-too-early') }
    expect(isMastered(firstTryCorrect, guidedCase)).toBe(true)
  })
  it('groups unresolved mistakes by knowledge and clears guided weakness after review', () => {
    const guidedCase = cases[0]
    const source = { id: 'g-weak', ticketId: guidedCase.id, createdAt: '2026-10-20T00:00:00Z', responses: {}, commands: [], hintLevel: 0, note: 'Evidence and next check', score: 5, total: 6, independent: false, outcomes: { output: false } }
    const progress = { ...emptyProgress(), guidedAttempts: [source] }
    expect(knowledgeQueue(progress, cases).find(item => item.skill === 'interpret')?.mode).toBe('guided')
    progress.reviewAttempts.push({ id: 'fixed', ticketId: guidedCase.id, sourceAttemptId: source.id, createdAt: '2026-10-20T01:00:00Z', kind: 'mistakes', questionIds: ['output'], responses: { output: ['stopped'] }, outcomes: { output: true } })
    expect(knowledgeQueue(progress, cases).find(item => item.skill === 'interpret')).toBeUndefined()
    progress.objectiveExamAttempts.push({ id: 'exam-weak', ticketId: guidedCase.id, createdAt: '2026-10-21T00:00:00Z', responses: {}, commands: [], outcomes: { output: false }, score: 0, total: 6, errors: [{ questionId: 'output', category: 'missing_evidence', detail: 'Read the service state', at: '2026-10-21T00:00:00Z' }] })
    expect(knowledgeQueue(progress, cases).find(item => item.skill === 'interpret')?.mode).toBe('objective')
  })
})
