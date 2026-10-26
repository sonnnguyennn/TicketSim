// Reconcile editorial review ledgers with effective authored content.
// Reviewer decisions are preserved; source verification is copied, never inferred from URLs.
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { loadCommandLibrary } from './content/load-command-library.mjs'

const root = path.resolve(import.meta.dirname, '..')
const folder = path.join(root, 'audit/phase-d3')
const reviewStatuses = new Set(['SME_PENDING', 'REVIEWED_PASS', 'EDIT_REQUIRED', 'NEEDS_SOURCE'])
const dimensionNames = ['syntax', 'flags', 'examples', 'output', 'interpretation', 'safety', 'distro']
const batch01Questions = new Set(['VPS-03-001/triage', 'VPS-05-002/output', 'VPS-05-002/evidence', 'VPS-07-001/evidence', 'VPS-10-008/output'])
const batch01Commands = new Set(['firewall-list', 'firewall-zones'])
const hash = value => `sha256:${createHash('sha256').update(JSON.stringify(value)).digest('hex')}`
const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`
function parseCsv(source) {
  const rows = []
  let row = [], cell = '', quoted = false
  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') { cell += '"'; i++ }
      else if (char === '"') quoted = false
      else cell += char
    } else if (char === '"') quoted = true
    else if (char === ',') { row.push(cell); cell = '' }
    else if (char === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else if (char !== '\r') cell += char
  }
  if (quoted) throw new Error('Unclosed CSV quote')
  if (cell || row.length) { row.push(cell); rows.push(row) }
  const [headers, ...items] = rows
  if (!headers) throw new Error('Empty CSV')
  return items.map(values => Object.fromEntries(headers.map((header, i) => [header, values[i] ?? ''])))
}
function readExisting(filename, key) {
  if (!fs.existsSync(filename)) return new Map()
  return new Map(parseCsv(fs.readFileSync(filename, 'utf8')).map(row => [key(row), row]))
}
function writeCsv(filename, columns, rows) {
  fs.writeFileSync(filename, [columns.join(','), ...rows.map(row => columns.map(column => quote(row[column])).join(','))].join('\n') + '\n')
}
function reviewerFields(previous, version) {
  const status = previous?.review_status || 'SME_PENDING'
  if (!reviewStatuses.has(status)) throw new Error(`Unknown review status ${status}`)
  const fields = {
    review_status: status,
    reviewer: previous?.reviewer ?? '',
    review_reason: previous?.review_reason ?? '',
    review_evidence: previous?.review_evidence ?? '',
    reviewed_version: previous?.reviewed_version ?? '',
    reviewed_at: previous?.reviewed_at ?? '',
    review_stale: previous?.reviewed_version && previous.reviewed_version !== version ? 'YES' : 'NO',
  }
  if (status !== 'SME_PENDING' && (!fields.reviewer || !fields.review_reason || !fields.review_evidence || !fields.reviewed_version)) throw new Error(`Incomplete reviewer decision ${status}`)
  return fields
}

const questionFile = path.join(folder, '06_Question_Editorial_Status.csv')
const oldQuestions = readExisting(questionFile, row => `${row.ticket_id}/${row.question_id}`)
const topicFiles = fs.readdirSync(path.join(folder, '03_Content_By_Topic')).filter(name => name.endsWith('.json')).sort()
const questions = topicFiles.flatMap(name => JSON.parse(fs.readFileSync(path.join(folder, '03_Content_By_Topic', name), 'utf8')).entries)
const questionRows = questions.map(item => {
  const version = hash({ prompt:item.prompt, options:item.options, correctIds:item.correctIds, explanation:item.explanation, hints:item.hints, requiredProbes:item.requiredProbes, relatedProbes:item.relatedProbes })
  const previous = oldQuestions.get(`${item.ticketId}/${item.questionId}`)
  return {
    ticket_id: item.ticketId, topic: item.topic, level: item.level, question_id: item.questionId,
    question_type: item.type, source: item.source.question, content_version: version,
    triage_labels: item.classification.join(';'),
    integrated_batch: batch01Questions.has(`${item.ticketId}/${item.questionId}`) ? 'D3_EDITORIAL_BATCH01' : '',
    ...reviewerFields(previous, version),
  }
})
if (questions.length !== 620 || new Set(questionRows.map(row => `${row.ticket_id}/${row.question_id}`)).size !== 620) throw new Error('Expected 620 unique scored questions')
if ([...oldQuestions.keys()].some(key => !questionRows.some(row => `${row.ticket_id}/${row.question_id}` === key))) throw new Error('A reviewed question disappeared')
const questionColumns = ['ticket_id','topic','level','question_id','question_type','source','content_version','triage_labels','integrated_batch','review_status','reviewer','review_reason','review_evidence','reviewed_version','reviewed_at','review_stale']
writeCsv(questionFile, questionColumns, questionRows)

const commandFile = path.join(folder, '07_Command_Expert_Review.csv')
const oldCommands = readExisting(commandFile, row => row.command_id)
const d2Ledger = new Map(parseCsv(fs.readFileSync(path.join(root, 'Phase_D2_Command_Review_Ledger.csv'), 'utf8')).map(row => [row.id, row]))
const cards = await loadCommandLibrary(root)
const commandRows = cards.map(card => {
  const knowledge = card.knowledge
  const d2 = d2Ledger.get(card.id)
  if (!knowledge || !d2 || d2.verification !== knowledge.verification) throw new Error(`D2 ledger and effective source differ: ${card.id}`)
  const fields = {
    command_id: card.id, family: card.family, kind: knowledge.kind, purpose: card.purpose,
    syntax: knowledge.syntax, flags_json: JSON.stringify(knowledge.options),
    examples_json: JSON.stringify(knowledge.examples), example_output: card.exampleOutput,
    interpretation: card.interpretation, proves: knowledge.proves, does_not_prove: knowledge.doesNotProve,
    safety: card.safety, privilege: card.privilege, centos: card.centos, ubuntu: card.ubuntu,
    context: card.context, source_urls: knowledge.sourceUrls.join('; '),
    source_verification: knowledge.verification, lab_verification: d2.lab_verification,
    sop_verification: knowledge.kind === 'support_task' ? 'PENDING' : 'NOT_APPLICABLE',
    card_source: d2.card_source, knowledge_source: d2.knowledge_source,
  }
  const version = hash(fields)
  const previous = oldCommands.get(card.id)
  return {
    ...fields, content_version: version, integrated_batch: batch01Commands.has(card.id) ? 'D3_EDITORIAL_BATCH01' : '',
    ...Object.fromEntries(dimensionNames.map(name => [`${name}_review`, previous?.[`${name}_review`] || 'SME_PENDING'])),
    ...reviewerFields(previous, version),
  }
})
if (cards.length !== 122 || new Set(commandRows.map(row => row.command_id)).size !== 122) throw new Error('Expected 122 unique command cards')
if ([...oldCommands.keys()].some(key => !commandRows.some(row => row.command_id === key))) throw new Error('A reviewed command disappeared')
for (const row of commandRows) for (const name of dimensionNames) if (!reviewStatuses.has(row[`${name}_review`])) throw new Error(`Unknown ${name} review status for ${row.command_id}`)
const commandColumns = ['command_id','family','kind','purpose','syntax','flags_json','examples_json','example_output','interpretation','proves','does_not_prove','safety','privilege','centos','ubuntu','context','source_urls','source_verification','lab_verification','sop_verification','card_source','knowledge_source','content_version','integrated_batch',...dimensionNames.map(name => `${name}_review`),'review_status','reviewer','review_reason','review_evidence','reviewed_version','reviewed_at','review_stale']
writeCsv(commandFile, commandColumns, commandRows)
const counts = Object.fromEntries([...Map.groupBy(commandRows, row => row.source_verification)].map(([status, group]) => [status, group.length]))
console.log(JSON.stringify({ questionRows: questionRows.length, questionReview: Object.fromEntries([...Map.groupBy(questionRows, row => row.review_status)].map(([status, group]) => [status, group.length])), commandRows: commandRows.length, commandVerification: counts, commandReview: Object.fromEntries([...Map.groupBy(commandRows, row => row.review_status)].map(([status, group]) => [status, group.length])) }, null, 2))
