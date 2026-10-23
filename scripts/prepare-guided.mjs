import fs from 'node:fs'
import path from 'node:path'
import Ajv2020 from 'ajv/dist/2020.js'
import { guidedContent } from './guided-content.mjs'

const root = path.resolve(import.meta.dirname, '..')
const source = JSON.parse(fs.readFileSync(path.join(root, 'starter-data/tickets.json'), 'utf8')).tickets
const schema = JSON.parse(fs.readFileSync(path.join(root, 'starter-data/guided_schema.json'), 'utf8'))
const ajv = new Ajv2020({ strict: false, allErrors: true })
if (!ajv.validate(schema, guidedContent)) throw new Error(`Guided content schema: ${ajv.errorsText()}`)

const ids = new Set()
const publicCases = guidedContent.map(content => {
  const ticket = source.find(item => item.id === content.id)
  if (!ticket || ids.has(content.id)) throw new Error(`Unknown or duplicate guided ticket: ${content.id}`)
  ids.add(content.id)
  const probes = ticket.probe_outputs.map((probe, index) => ({
    id: probe.probe_id, command: probe.command, output: probe.stdout, context: 'guest', ...content.probeNotes[index],
  }))
  content.extras.forEach((probe, index) => probes.push({ id: `G${index + 1}`, context: 'guest', ...probe }))
  const variants = new Set()
  for (const probe of probes) {
    for (const state of probe.requiredState ?? ['initial']) for (const variant of [probe.command, ...probe.aliases]) {
      const key = `${state}:${variant.trim().replace(/\s+/g, ' ').toLowerCase()}`
      if (variants.has(key)) throw new Error(`Duplicate command variant for ${content.id}/${state}: ${variant}`)
      variants.add(key)
    }
  }
  const probeIds = new Set(probes.map(probe => probe.id))
  if (probeIds.size !== probes.length) throw new Error(`Duplicate probe id for ${content.id}`)
  if (probes.some(probe => probe.requiredState?.some(state => state !== 'initial' && !content.simulation?.states.includes(state)))) throw new Error(`Unknown probe state for ${content.id}`)
  if (content.branches && new Set(content.branches.map(branch => branch.id)).size !== content.branches.length) throw new Error(`Duplicate branch id for ${content.id}`)
  if (probes.some(probe => probe.branchId && !content.branches?.some(branch => branch.id === probe.branchId))) throw new Error(`Unknown probe branch for ${content.id}`)
  if (content.branches?.some(branch => [...branch.requiredProbeIds, ...branch.probeIds].some(id => !probeIds.has(id)))) throw new Error(`Unknown branch probe for ${content.id}`)
  if (content.simulation?.transitions.some(transition => !content.simulation.states.includes(transition.from) || !content.simulation.states.includes(transition.to) || transition.requiredProbeIds.some(id => !probeIds.has(id)))) throw new Error(`Invalid simulation transition for ${content.id}`)
  if (content.simulation && (content.simulation.states[0] !== 'initial' || content.simulation.verificationProbeIds.some(id => !probeIds.has(id)) || content.simulation.transitions.some(transition => transition.allowed && transition.from === transition.to))) throw new Error(`Invalid simulation verification for ${content.id}`)
  const questionIds = new Set()
  const authoredQuestions = [...content.questions, { id: 'note', stage: 'verify', kind: 'short_answer', prompt: content.verificationPrompt, options: [], correctIds: [], explanation: 'Tự đối chiếu ghi chú với đáp án mẫu sau khi nộp.' }]
  const questions = authoredQuestions.map(question => {
    if (questionIds.has(question.id)) throw new Error(`Duplicate question ${content.id}/${question.id}`)
    questionIds.add(question.id)
    const optionIds = question.options.map(option => option.id)
    if (new Set(optionIds).size !== optionIds.length || question.correctIds.some(id => !optionIds.includes(id)) || (question.kind === 'short_answer' ? optionIds.length !== 0 || question.correctIds.length !== 0 : optionIds.length < 3 || question.correctIds.length < 1) || (question.kind === 'step_order' && (question.correctIds.length !== optionIds.length || new Set(question.correctIds).size !== optionIds.length)) || (!['multi_select', 'step_order', 'short_answer'].includes(question.kind) && question.correctIds.length !== 1)) throw new Error(`Invalid answer key ${content.id}/${question.id}`)
    if (question.requiredProbeIds?.some(id => !probes.some(probe => probe.id === id))) throw new Error(`Unknown probe reference ${content.id}/${question.id}`)
    const feedback = { correctIds: question.correctIds, explanation: question.explanation, commandId: question.commandId, optionFeedback: Object.fromEntries(question.options.map(option => [option.id, option.feedback])) }
    if (question.kind !== 'short_answer') {
      const feedbackPath = path.join(root, 'public/guided-feedback', content.id, `${question.id}.json`)
      fs.mkdirSync(path.dirname(feedbackPath), { recursive: true })
      fs.writeFileSync(feedbackPath, JSON.stringify(feedback, null, 2))
    }
    return { id: question.id, stage: question.stage, kind: question.kind, prompt: question.prompt, options: question.options.map(({ id, label }) => ({ id, label })), requiredProbeIds: question.requiredProbeIds, commandId: question.commandId, skill: question.skill ?? question.stage }
  })
  const hintPath = path.join(root, 'public/guided-hints', `${content.id}.json`)
  fs.mkdirSync(path.dirname(hintPath), { recursive: true })
  fs.writeFileSync(hintPath, JSON.stringify({ hints: content.hints }, null, 2))
  if (content.branches?.some(branch => branch.questionIds.some(id => !questionIds.has(id)))) throw new Error(`Unknown branch question for ${content.id}`)
  let objectiveExam
  if (content.objectiveExam) {
    const question = content.objectiveExam
    if (question.stage !== 'verify' || question.kind !== 'single_choice' || question.correctIds.length !== 1 || question.options.length < 3 || !question.options.some(option => option.id === question.correctIds[0])) throw new Error(`Invalid objective verification ${content.id}`)
    const feedbackPath = path.join(root, 'public/objective-feedback', content.id, 'exam-verify.json')
    fs.mkdirSync(path.dirname(feedbackPath), { recursive: true })
    fs.writeFileSync(feedbackPath, JSON.stringify({ correctIds: question.correctIds, explanation: question.explanation, optionFeedback: Object.fromEntries(question.options.map(option => [option.id, option.feedback])) }, null, 2))
    objectiveExam = { id: question.id, stage: question.stage, kind: question.kind, prompt: question.prompt, options: question.options.map(({ id, label }) => ({ id, label })) }
  }
  return { id: content.id, objective: content.objective, customerFollowup: content.customerFollowup, probes, questions, verificationPrompt: content.verificationPrompt, branches: content.branches, simulation: content.simulation, objectiveExam }
})

const outputPath = path.join(root, 'src/data/guided-public.json')
fs.writeFileSync(outputPath, JSON.stringify(publicCases, null, 2))
console.log(`Prepared ${publicCases.length} Guided cases with separated feedback and hints.`)
