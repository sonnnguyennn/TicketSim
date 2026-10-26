import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { guidedContent, guidedReferenceNotes, unreviewedGuidedContent } from './guided-content.mjs'
import { phaseBEdits, phaseBStage } from './content/phase-b-index.mjs'
import { loadCommandLibrary } from './content/load-command-library.mjs'

const root = path.resolve(import.meta.dirname, '..')
const partial = process.argv.includes('--partial')
const read = filename => JSON.parse(fs.readFileSync(path.join(root, filename), 'utf8'))
const baseline = read('qa/phase-b-baseline.json')
const source = read('starter-data/tickets.json').tickets
const cards = await loadCommandLibrary(root)
const hash = value => crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex')
const errors = []
const check = (condition, message) => { if (!condition) errors.push(message) }
const oldById = new Map(unreviewedGuidedContent.map(content => [content.id, content]))
const publicCases = read('src/data/guided-public.json')
const fixtures = []
const stats = { ticketsChanged: 0, reviewed: Object.keys(phaseBEdits).length, questionPromptsRewritten: 0, explanationsRewritten: 0, optionLabelsRewritten: 0, optionFeedbackRewritten: 0, hintsRewritten: 0, verificationPromptsRewritten: 0, answerFieldsRewritten: 0, cardsChanged: 0 }
const filler = /\bP[12]\b|\bfixture\b|\broot cause\b|các output không có giá trị|cách diễn giải bám các output|thiếu bằng chứng, quyền hoặc bảo vệ|trực tiếp đọc fixture|hãy lưu ý rằng|điều quan trọng cần hiểu là/i
const brokenSpacing = /\b(?:N SS|qua y|c l one|o per a to r|p o l i c y)\b/i
const rows = []
const choiceCues = { singleChoiceQuestions: 0, correctStrictlyLongest: 0, correctPositions: {}, byTopic: {} }
function probes(content, ticket) {
  return [...ticket.probe_outputs.map((probe, index) => ({ id: probe.probe_id, command: content.probeCommandOverrides?.[probe.probe_id] ?? probe.command, output: content.probeOverrides?.[probe.probe_id] ?? probe.stdout, ...content.probeNotes[index] })), ...content.extras.map((probe, index) => ({ id: `G${index + 1}`, ...probe }))]
}
function duplicates(items) {
  const groups = new Map()
  for (const content of items) for (const question of content.questions) {
    const text = question.prompt.trim().replace(/\s+/g, ' ').toLowerCase()
    groups.set(text, [...(groups.get(text) ?? []), `${content.id}/${question.id}`])
  }
  return [...groups].filter(([, ids]) => ids.length > 1).map(([prompt, ids]) => ({ prompt, count: ids.length, ids })).sort((a, b) => b.count - a.count)
}
function repeatedFeedback(items) {
  const counts = new Map()
  for (const content of items) for (const question of content.questions) for (const option of question.options) {
    const text = option.feedback.trim().replace(/\s+/g, ' ').toLowerCase()
    counts.set(text, (counts.get(text) ?? 0) + 1)
  }
  return [...counts].filter(([, count]) => count > 1).map(([feedback, count]) => ({ feedback, count })).sort((a, b) => b.count - a.count)
}
check(guidedContent.length === 112 && new Set(guidedContent.map(content => content.id)).size === 112, 'Expected112 uniqueGuided')
check(Object.keys(guidedReferenceNotes).length === 112 && source.every(ticket => guidedReferenceNotes[ticket.id]), 'Expected112 English reference notes')
for (const ticket of source) {
  const note = guidedReferenceNotes[ticket.id]
  const answer = read(`public/guided-answers/${ticket.id}.json`)
  check(answer.referenceNoteEn === note, `${ticket.id}: generated reference note differs from authoring source`)
  check(['Issue:', 'Findings:', 'Next Action:', 'Verification:', 'Status:'].every(label => note?.includes(label)), `${ticket.id}: incomplete reference note`)
  check(!/[À-ỹĐđ]|\b(?:TODO|TBD|PLACEHOLDER)\b/i.test(note ?? ''), `${ticket.id}: untranslated or placeholder reference note`)
  const content = guidedContent.find(item => item.id === ticket.id)
  for (const field of ['expected_diagnosis', 'recommended_next_checks', 'resolution_guidance', 'verification', 'escalate_when', 'production_warning']) {
    check(answer[field] === (content?.answerOverrides?.[field] ?? ticket[field]), `${ticket.id}: legacy answer field changed: ${field}`)
  }
  check(JSON.stringify(answer.scoring_rubric) === JSON.stringify(ticket.scoring_rubric), `${ticket.id}: legacy scoring rubric changed`)
}
check(cards.length === 122 && new Set(cards.map(card => card.id)).size === 122, 'Expected122 uniquecommandcards')
if (!partial) check(stats.reviewed === 112 && phaseBStage === 'all', 'Fullreview requires112 explicitcase records')
for (const [filename, digest] of Object.entries(baseline.protectedFiles)) {
  let protectedText = fs.readFileSync(path.join(root, filename), 'utf8').replace(/\r\n/g, '\n')
  if (filename === 'starter-data/tickets.json') {
    // D1 is allowed to correct exactly two historical journal fixtures in the
    // original ticket source. Reverse only these six field values before the
    // frozen Phase B hash check; any other ticket edit still fails this gate.
    const replacements = [
      ['journalctl -u backup-agent --since "02:00" --until "02:30"', 'journalctl -u backup-agent --since "2026-10-22 02:00:00 UTC" --until "2026-10-22 02:30:00 UTC"', 2],
      ['backup started 02:00; finished 02:20', 'Oct 22 02:00:00 vps backup-agent[901]: backup started\nOct 22 02:20:00 vps backup-agent[901]: backup finished', 1],
      ['journalctl -u sshd --since today', 'journalctl -u sshd --since "2026-10-22 09:00:00 UTC" --until "2026-10-22 09:30:00 UTC"', 2],
      ['Accepted publickey for root from 203.0.113.77', 'Oct 22 09:14:20 vps sshd[3104]: Accepted publickey for root from 203.0.113.77 port 51144 ssh2: ED25519 SHA256:uXzRs1YoPvjS/9wVRD4Zf1uTj3PseKqFLu6q0HD1mOk', 1],
    ]
    for (const [before, after, expectedCount] of replacements) {
      const oldEncoded = JSON.stringify(before).slice(1, -1)
      const newEncoded = JSON.stringify(after).slice(1, -1)
      check(protectedText.split(newEncoded).length - 1 === expectedCount, `D1 source fixture occurrence changed: ${before}`)
      protectedText = protectedText.replaceAll(newEncoded, oldEncoded)
    }
    // The original JSON blob ended without a final newline.
    protectedText = protectedText.replace(/\n$/, '')
  }
  check(hash(protectedText) === digest, `Protected source/progress/engine changed: ${filename}`)
}
for (const content of guidedContent) {
  const ticket = source.find(item => item.id === content.id)
  const old = baseline.tickets.find(item => item.id === content.id)
  const edit = phaseBEdits[content.id]
  const caseProbes = probes(content, ticket)
  const initial = caseProbes.filter(probe => !probe.requiredState || probe.requiredState.includes('initial'))
  const ids = new Set(caseProbes.map(probe => probe.id))
  const docIds = new Set(cards.map(card => card.id))
  const generated = publicCases.find(item => item.id === content.id)
  check(content.questions.length === old.questions.length, `${content.id}: question count changed`)
  // D1 fixes the ss output in one review evidence fixture. Compare all other
  // hidden content against the frozen baseline by restoring only that output.
  const reviewVariantsForBaseline = structuredClone(content.reviewVariants)
  if (content.id === 'VPS-01-001') {
    const currentSs = reviewVariantsForBaseline?.[0]?.evidence?.find(item => item.label.includes('ss -ltnp'))
    const originalSs = oldById.get(content.id)?.reviewVariants?.[0]?.evidence?.find(item => item.label.includes('ss -ltnp'))
    check(!!currentSs && !!originalSs && currentSs.output.includes('Peer Address:Port') && currentSs.output.includes('0.0.0.0:*'), `${content.id}: D1 review ss fixture malformed`)
    if (currentSs && originalSs) currentSs.output = originalSs.output
  }
  check(hash({ simulation: content.simulation, objectiveExam: content.objectiveExam, reviewVariants: reviewVariantsForBaseline }) === old.hiddenHash, `${content.id}: hidden assessment changed`)
  let changed = false
  for (const question of content.questions) {
    const before = old.questions.find(item => item.id === question.id)
    check(!!before, `${content.id}: unknown question ${question.id}`)
    if (!before) continue
    check(question.kind === before.kind && hash(question.correctIds) === hash(before.correctIds) && hash(question.requiredProbeIds ?? []) === hash(before.requiredProbeIds), `${content.id}/${question.id}: grading or gate changed`)
    check(hash(question.options.map(option => option.id).sort()) === hash(before.options.map(option => option.id).sort()), `${content.id}/${question.id}: optionidentity changed`)
    check(new Set(question.options.map(option => option.label.trim())).size === question.options.length, `${content.id}/${question.id}: duplicateoptionlabel`)
    check(new Set(question.options.map(option => option.id)).size === question.options.length, `${content.id}/${question.id}: duplicateoption`)
    check(new Set(question.correctIds).size === question.correctIds.length && question.correctIds.every(id => question.options.some(option => option.id === id)), `${content.id}/${question.id}: invalidcorrectIDs`)
    check(question.kind === 'step_order' ? question.correctIds.length === question.options.length : question.kind === 'multi_select' ? question.correctIds.length >= 1 : question.correctIds.length === 1, `${content.id}/${question.id}: invalidkeyarity`)
    check((question.requiredProbeIds ?? []).every(id => ids.has(id) && initial.some(probe => probe.id === id)), `${content.id}/${question.id}: unreachableevidence`)
    if (question.commandId) check(docIds.has(question.commandId), `${content.id}/${question.id}: missingcommanddoc`)
    check(question.explanation?.length > 9 && question.options.every(option => option.feedback?.length > 4), `${content.id}/${question.id}: missingfeedback`)
    if (hash(question.prompt) !== before.promptHash) { stats.questionPromptsRewritten++; changed = true }
    if (hash(question.explanation) !== before.explanationHash) { stats.explanationsRewritten++; changed = true }
    for (const option of question.options) {
      const previous = before.options.find(item => item.id === option.id)
      if (hash(option.label) !== previous.labelHash) { stats.optionLabelsRewritten++; changed = true }
      if (hash(option.feedback) !== previous.feedbackHash) { stats.optionFeedbackRewritten++; changed = true }
    }
    if (edit) check(!filler.test([question.prompt, question.explanation, ...question.options.flatMap(option => [option.label, option.feedback])].join('\n')), `${content.id}/${question.id}: placeholder/internaljargon`)
    if (edit && question.kind !== 'step_order' && question.correctIds.length === 1) {
      const position = question.options.findIndex(option => option.id === question.correctIds[0])
      const lengths = question.options.map(option => option.label.length)
      const longest = lengths[position] > Math.max(...lengths.filter((_, index) => index !== position))
      const topic = content.id.split('-')[1]
      choiceCues.singleChoiceQuestions++
      choiceCues.correctStrictlyLongest += Number(longest)
      choiceCues.correctPositions[position + 1] = (choiceCues.correctPositions[position + 1] ?? 0) + 1
      choiceCues.byTopic[topic] ??= { questions: 0, correctStrictlyLongest: 0 }
      choiceCues.byTopic[topic].questions++
      choiceCues.byTopic[topic].correctStrictlyLongest += Number(longest)
    }
  }
  for (const probe of caseProbes) check(docIds.has(probe.commandId), `${content.id}/${probe.id}: missingprobedoc`)
  if (edit) {
    check(content.customerExplanation?.length >= 15 && initial.every(probe => probe.purpose?.length > 4 && probe.why?.length >= 10 && probe.meaning?.length > 4), `${content.id}: incompletelearningcontext`)
    check(edit.review?.technical?.length > 30 && edit.review?.editorial?.length > 20 && (edit.review?.references?.length > 0 || initial.every(probe => probe.context === 'panel')), `${content.id}: missingcaseinspectionnotes`)
    check(!filler.test([content.customerExplanation, content.verificationPrompt, ...content.hints, ...initial.flatMap(probe => [probe.purpose, probe.why, probe.meaning])].join('\n')), `${content.id}: internallearningjargon`)
    const learnerText = [content.customerExplanation, content.verificationPrompt, ...content.hints, ...initial.flatMap(probe => [probe.purpose, probe.why, probe.meaning]), ...content.questions.flatMap(question => [question.prompt, question.explanation, ...question.options.flatMap(option => [option.label, option.feedback])]), ...Object.values(content.answerOverrides ?? {})].join('\n')
    check(!brokenSpacing.test(learnerText), `${content.id}: suspicious broken spacing in learner text (${learnerText.match(brokenSpacing)?.[0] ?? ''})`)
    const previousProbes = probes(oldById.get(content.id), ticket)
    for (const probe of initial) {
      const previous = previousProbes.find(item => item.id === probe.id)
      check((previous.aliases ?? []).every(alias => probe.aliases.includes(alias)), `${content.id}/${probe.id}: explicitalias removed`)
      if (probe.output !== previous.output || probe.command !== previous.command) {
        const reason = edit.review.fixtureChanges?.find(item => item.probeId === probe.id)
        check(!!reason?.reason, `${content.id}/${probe.id}: undocumentedfixturechange`)
        fixtures.push({ ticketId: content.id, probeId: probe.id, beforeCommand: previous.command, command: probe.command, before: previous.output, after: probe.output, reason: reason?.reason, references: reason?.reference ? [reason.reference] : edit.review.references })
      }
    }
    const answer = read(`public/guided-answers/${content.id}.json`)
    for (const [field, text] of Object.entries(content.answerOverrides ?? {})) {
      check(answer[field] === text && !filler.test(text), `${content.id}: finalanswer ${field}`)
      if (ticket[field] !== text) stats.answerFieldsRewritten++
    }
    if (!partial) check(Object.keys(content.answerOverrides ?? {}).length === 6, `${content.id}: finalanswer not reviewed`)
  }
  check(content.hints.length === 3 && content.hints.every(hint => hint.length > 9), `${content.id}: missinghints`)
  stats.hintsRewritten += content.hints.filter((hint, index) => hash(hint) !== old.hints[index]).length
  if (hash(content.verificationPrompt) !== old.verificationHash) stats.verificationPromptsRewritten++
  if (changed) stats.ticketsChanged++
  check(generated.questions.every(question => !('correctIds' in question) && !('explanation' in question) && !question.options.some(option => 'feedback' in option)), `${content.id}: publicanswerleak`)
  rows.push({ id: content.id, topic: ticket.topic_vi, level: ticket.difficulty, status: edit ? 'Đã rà soát và sửa' : 'Chờ rà soát', technical: edit?.review.technical ?? '', editorial: edit?.review.editorial ?? '', references: edit?.review.references ?? [] })
}
const beforeDuplicates = duplicates(baseline.tickets), afterDuplicates = duplicates(guidedContent)
const feedbackDuplicates = { before: repeatedFeedback(unreviewedGuidedContent), after: repeatedFeedback(guidedContent) }
if (!partial) check(!afterDuplicates.some(group => group.count >= 8), 'Massrepeated questiontemplate remains')
for (const card of cards) {
  const previous = baseline.commands.find(item => item.id === card.id)
  check(!!previous, `New commandcard ${card.id}`)
  check(['purpose', 'flags', 'centos', 'ubuntu', 'interpretation', 'whenToUse', 'followUp', 'pitfalls', 'privilege'].every(field => typeof card[field] === 'string' && card[field].length > 0), `${card.id}: incompletecard`)
  if (previous && Object.entries(card).some(([field, value]) => hash(value) !== previous.fields[field])) stats.cardsChanged++
  check(!filler.test([card.purpose, card.flags, card.interpretation, card.whenToUse, card.followUp, card.pitfalls].join('\n')), `${card.id}: internalcardjargon`)
  const knowledge = card.knowledge
  check(!!knowledge, `${card.id}: missing D2 knowledge`)
  if (!knowledge) continue
  check(knowledge.kind === (card.context === 'panel' ? 'support_task' : 'shell'), `${card.id}: wrong knowledge kind`)
  check(Array.isArray(knowledge.options) && Array.isArray(knowledge.examples) && knowledge.examples.length > 0, `${card.id}: incomplete options/examples`)
  check(typeof knowledge.proves === 'string' && knowledge.proves.length > 10 && typeof knowledge.doesNotProve === 'string' && knowledge.doesNotProve.length > 10, `${card.id}: missing evidence boundary`)
  check(['SOURCE_VERIFIED', 'LAB_VERIFIED', 'INTERNAL_SOP_REQUIRED', 'PENDING'].includes(knowledge.verification), `${card.id}: invalid verification`)
  if (knowledge.verification === 'SOURCE_VERIFIED') check(knowledge.sourceUrls.length > 0 && knowledge.sourceUrls.every(url => url.startsWith('https://')), `${card.id}: source claim without URL`)
  if (knowledge.kind === 'shell') {
    check(knowledge.syntax === card.command, `${card.id}: example/syntax mismatch`)
    check(!knowledge.task, `${card.id}: shell has task metadata`)
    check(knowledge.options.every(option => ['flag', 'subcommand', 'argument', 'database', 'target', 'filter', 'command'].includes(option.kind) && [option.name, option.purpose, option.when, option.example].every(value => typeof value === 'string' && value.length > 0)), `${card.id}: incomplete structured option`)
    check(knowledge.examples.every(example => example.command && example.context && example.interpretation && typeof example.outputIsExcerpt === 'boolean'), `${card.id}: incomplete usage example`)
  } else {
    check(!!knowledge.task && knowledge.options.length === 0 && knowledge.verification === 'INTERNAL_SOP_REQUIRED', `${card.id}: unsupported panel workflow claim`)
    if (knowledge.task) check(knowledge.task.where && knowledge.task.dataToCheck.length && knowledge.task.authority && knowledge.task.observableOutcomes.length && knowledge.task.limits && knowledge.task.escalation, `${card.id}: incomplete support task`)
  }
}
const commandReview = read('scripts/content/phase-b-command-review.json')
check(commandReview.length === 122 && new Set(commandReview.map(item => item.id)).size === 122 && commandReview.every(item => cards.some(card => card.id === item.id) && item.inspected && item.finding.length > 20), 'Incomplete122cardinspectionrecord')
fs.writeFileSync(path.join(root, 'Phase_B_Command_Audit.md'), '# Phase B — Command Library audit\n\n122 thẻ được agent đọc theo source: công dụng, flags, OS/context, ví dụ, giới hạn kết luận và quyền. Không thực thi trên CentOS/Ubuntu thật. Ví dụ ngắn được hiển thị là trích đoạn; stdout rỗng có ghi chú ngoài output.\n\n| ID | Trạng thái | Trường sửa | Nội dung đã đối chiếu |\n|---|---|---|---|\n' + commandReview.map(item => `| ${item.id} | ${item.status} | ${item.changedFields.join(', ')} | ${item.finding.replaceAll('|', '/')} |`).join('\n') + '\n')
const coverage = { guided: guidedContent.length, objectiveExam: guidedContent.filter(content => content.objectiveExam).length, stateful: guidedContent.filter(content => content.simulation).length, variantTickets: guidedContent.filter(content => content.reviewVariants?.length).length, variants: guidedContent.reduce((sum, content) => sum + (content.reviewVariants?.length ?? 0), 0) }
const result = { stage: phaseBStage, stats, coverage, sourceTickets: source.length, guided: guidedContent.length, commands: cards.length, fixtureChanges: fixtures.length, choiceCues, beforeDuplicates, afterDuplicates, feedbackDuplicates, errors, rows }
fs.mkdirSync(path.join(root, 'qa'), { recursive: true })
fs.writeFileSync(path.join(root, 'qa/phase-b-audit.json'), JSON.stringify(result, null, 2))
fs.writeFileSync(path.join(root, 'qa/phase-b-fixture-changes.json'), JSON.stringify(fixtures, null, 2))
fs.writeFileSync(path.join(root, 'Phase_B_Ticket_Audit.md'), '# Phase B — Audit theo ticket\n\nCác ghi chú dưới đây là rà soát từng case bởi agent, không phải chỉ schema validation và không phải chứng nhận độc lập của chuyên gia con người.\n\n| ID | Topic | Level | Trạng thái | Kiểm tra kỹ thuật | Biên tập |\n|---|---|---|---|---|---|\n' + rows.map(row => `| ${row.id} | ${row.topic} | L${row.level} | ${row.status} | ${row.technical.replaceAll('|', '/')} | ${row.editorial.replaceAll('|', '/')} |`).join('\n') + '\n')
fs.writeFileSync(path.join(root, 'Phase_B_Duplicate_Report.md'), '# Phase B — Duplicate/template report\n\nPhát hiện trùng chỉ là chỉ báo; không chứng minh chất lượng sư phạm.\n\n' + [['Trước', beforeDuplicates], ['Sau', afterDuplicates]].map(([label, groups]) => `## ${label}\n\n${groups.length} nhóm prompt trùng; nhóm lớn nhất ${groups[0]?.count ?? 1} câu.\n\n` + groups.map(group => `- ${group.count}× ${group.prompt}`).join('\n')).join('\n\n') + '\n')
fs.appendFileSync(path.join(root, 'Phase_B_Duplicate_Report.md'), '\n## Feedback và dấu hiệu gợi đáp án\n\n' + `Feedback trùng nguyên văn: trước ${feedbackDuplicates.before.length} nhóm (lớn nhất ${feedbackDuplicates.before[0]?.count ?? 1}); sau ${feedbackDuplicates.after.length} nhóm (lớn nhất ${feedbackDuplicates.after[0]?.count ?? 1}).\n\n` + `Trong ${choiceCues.singleChoiceQuestions} câu có một đáp án đúng đã rà soát (không gồm sắp xếp), ${choiceCues.correctStrictlyLongest} câu có nhãn đúng dài nhất duy nhất. Đây là chỉ báo cần đọc lại, không phải chứng nhận rằng phương án sai hợp lý. Phân bố vị trí đáp án đúng: ${JSON.stringify(choiceCues.correctPositions)}. ID/key giữ nguyên; vị trí được xoay ổn định theo ID câu.\n\n` + 'Feedback trùng sau sửa:\n\n' + (feedbackDuplicates.after.map(group => `- ${group.count}× ${group.feedback}`).join('\n') || 'Không có feedback trùng nguyên văn.') + '\n')
const visibleTrailingSpace = value => value.replace(/[ \t]+$/gm, trailing => trailing.replaceAll(' ', '␠').replaceAll('\t', '⇥'))
fs.writeFileSync(path.join(root, 'Phase_B_Fixture_Changes.md'), '# Phase B — Guided-only fixture corrections\n\nSource112 và output đã lưu trong tiến độ không bị viết lại. Các mẫu bên dưới được biên soạn theo định dạng tài liệu tham khảo; không chạy trên VPS thật. Ký hiệu ␠ và ⇥ trong khối output biểu thị space và tab ở cuối dòng của dữ liệu gốc.\n\n' + fixtures.map(item => `## ${item.ticketId}/${item.probeId}\n\n${item.reason}\n\nCommand trước: \`${item.beforeCommand}\`; sau: \`${item.command}\`.\n\nTrước:\n\n\`\`\`text\n${visibleTrailingSpace(item.before)}\n\`\`\`\n\nSau:\n\n\`\`\`text\n${visibleTrailingSpace(item.after)}\n\`\`\`\n\nTham khảo: ${item.references.join(', ')}`).join('\n\n') + '\n')
console.log(JSON.stringify({ ...stats, guided: guidedContent.length, commands: cards.length, fixtureChanges: fixtures.length, maxDuplicateBefore: beforeDuplicates[0]?.count ?? 1, maxDuplicateAfter: afterDuplicates[0]?.count ?? 1, errors: errors.length }, null, 2))
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1 }
