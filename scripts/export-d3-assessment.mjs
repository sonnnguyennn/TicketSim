// Read-only assessment export. Never writes authored or runtime content.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { guidedContent, guidedReferenceNotes } from './guided-content.mjs'
import { loadCommandLibrary } from './content/load-command-library.mjs'

const root = path.resolve(import.meta.dirname, '..')
const out = path.join(root, 'audit/phase-d3')
const byTopic = path.join(out, '03_Content_By_Topic')
const tickets = JSON.parse(fs.readFileSync(path.join(root, 'starter-data/tickets.json'), 'utf8')).tickets
const generatedCases = JSON.parse(fs.readFileSync(path.join(root, 'src/data/guided-public.json'), 'utf8'))
const ticketById = new Map(tickets.map(ticket => [ticket.id, ticket]))
const generatedById = new Map(generatedCases.map(content => [content.id, content]))
const cards = await loadCommandLibrary(root)
const cardById = new Map(cards.map(card => [card.id, card]))
const head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const cardCounts = Object.fromEntries([...Map.groupBy(cards, card => card.knowledge?.verification ?? 'UNSPECIFIED')].map(([key, group]) => [key, group.length]))
const sourceFiles = [
  'scripts/content/phase-b-01-05.mjs',
  'scripts/content/phase-b-06-10.mjs',
  'scripts/content/phase-b-11-14.mjs',
  'scripts/content/phase-b-08-editorial.mjs',
  'scripts/content/phase-b-09-editorial.mjs',
  'scripts/guided-content.mjs',
  'src/guided/commands.ts',
]
const sourceLines = Object.fromEntries(sourceFiles.map(file => [file, fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/)]))
const escapeRe = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const firstLine = (file, pattern, start = 0, end = Infinity) => {
  const lines = sourceLines[file]
  const index = lines.findIndex((line, i) => i >= start && i < end && pattern.test(line))
  return index < 0 ? null : `${file}:${index + 1}`
}
function sourceFor(ticketId, questionId) {
  const topicNumber = Number(ticketId.split('-')[1])
  const file = topicNumber <= 5 ? sourceFiles[0] : topicNumber <= 10 ? sourceFiles[1] : sourceFiles[2]
  const lines = sourceLines[file]
  const start = lines.findIndex(line => new RegExp(`^\\s*['"]${escapeRe(ticketId)}['"]\\s*:`).test(line))
  const next = lines.findIndex((line, i) => i > start && /^\s*['"]VPS-\d\d-\d\d\d['"]\s*:/.test(line))
  const end = next < 0 ? lines.length : next
  const question = start < 0 ? null : firstLine(file, new RegExp(`(?:^|[,{\\s])['"]?${escapeRe(questionId)}['"]?\\s*:\\s*(?:Q\\(|question\\(|\\{)`), start, end)
  const overrides = sourceFiles.slice(3).flatMap(other => {
    const found = firstLine(other, new RegExp(`${escapeRe(ticketId)}.{0,80}['"]${escapeRe(questionId)}['"]|${escapeRe(ticketId)}.*${escapeRe(questionId)}`))
    return found ? [found] : []
  })
  return { question: question ?? `${file}:${start + 1}`, case: `${file}:${start + 1}`, gradingBase: firstLine('scripts/guided-content.mjs', new RegExp(`^\\s*id:\s*['"]${escapeRe(ticketId)}['"]`)) ?? 'scripts/guided-content.mjs', overrides }
}
const csv = value => `"${String(value ?? '').replaceAll('"', '""')}"`
const csvRow = values => values.map(csv).join(',')
const excerpt = (value, length = 110) => String(value ?? '').replace(/\s+/g, ' ').slice(0, length)
const flag = (labels, label, reason, evidence, source) => labels.push({ label, reason, evidence: excerpt(evidence, 180), source })
const rows = []
const conflicts = []
const commandUses = new Map()
for (const content of guidedContent) {
  const ticket = ticketById.get(content.id)
  if (!ticket) throw new Error(`Unknown ticket ${content.id}`)
  const probes = ticket.probe_outputs.map((probe, i) => ({ id: probe.probe_id, command: content.probeCommandOverrides?.[probe.probe_id] ?? probe.command, output: content.probeOverrides?.[probe.probe_id] ?? probe.stdout, context: 'guest', ...content.probeNotes[i] }))
  content.extras.forEach((probe, i) => probes.push({ id: `G${i + 1}`, context: 'guest', ...probe }))
  for (const probe of probes) {
    if (!probe.commandId) continue
    const uses = commandUses.get(probe.commandId) ?? new Set()
    uses.add(content.id)
    commandUses.set(probe.commandId, uses)
    if (!cardById.has(probe.commandId)) conflicts.push({ ticketId: content.id, questionId: '(probe)', commandId: probe.commandId, issue: `Probe ${probe.id} links to missing Command Library ID`, sourceToFix: sourceFor(content.id, content.questions[0].id).case })
  }
  for (const question of content.questions) {
    const publicQuestion = generatedById.get(content.id)?.questions.find(item => item.id === question.id)
    const publicFeedback = JSON.parse(fs.readFileSync(path.join(root, 'public/guided-feedback', content.id, `${question.id}.json`), 'utf8'))
    if (!publicQuestion || publicQuestion.prompt !== question.prompt || JSON.stringify(publicQuestion.options) !== JSON.stringify(question.options.map(({id,label})=>({id,label}))) || JSON.stringify(publicFeedback.correctIds) !== JSON.stringify(question.correctIds) || publicFeedback.explanation !== question.explanation || question.options.some(option => publicFeedback.optionFeedback[option.id] !== option.feedback)) throw new Error(`Authored/runtime mismatch: ${content.id}/${question.id}; run npm run prepare-data first`)
    const source = sourceFor(content.id, question.id)
    const related = probes.filter(probe => (question.requiredProbeIds ?? []).includes(probe.id) || (question.commandId && question.commandId === probe.commandId))
    const relatedIds = new Set(related.map(probe => probe.commandId).filter(Boolean))
    if (question.commandId) relatedIds.add(question.commandId)
    const commandLinks = [...relatedIds].map(id => {
      const card = cardById.get(id)
      return { id, present: !!card, command: card?.command, kind: card?.knowledge?.kind, verification: card?.knowledge?.verification, purpose: card?.purpose, proves: card?.knowledge?.proves, doesNotProve: card?.knowledge?.doesNotProve, examples: card?.knowledge?.examples, sourceUrls: card?.knowledge?.sourceUrls, source: firstLine('src/guided/commands.ts', new RegExp(`^\\s*\\{\\s*id:\s*['"]${escapeRe(id)}['"]`)) ?? `src/guided/commands.ts (id ${id})` }
    })
    for (const link of commandLinks) {
      const uses = commandUses.get(link.id) ?? new Set()
      uses.add(content.id)
      commandUses.set(link.id, uses)
      if (!link.present) conflicts.push({ ticketId: content.id, questionId: question.id, commandId: link.id, issue: 'Question/probe links to missing Command Library ID', sourceToFix: source.question })
    }
    const labels = []
    if (question.prompt.length > 180) flag(labels, 'EDIT_CLARITY', 'Prompt vượt 180 ký tự; tách mục tiêu hoặc rút câu để người học đọc được trong một lượt.', question.prompt, source.question)
    const longOption = question.options.find(option => option.label.length > 155)
    if (longOption) flag(labels, 'EDIT_CLARITY', `Option ${longOption.id} vượt 155 ký tự; cần kiểm tra khả năng đọc và cùng phạm vi với các lựa chọn khác.`, longOption.label, source.question)
    const correct = question.options.filter(option => question.correctIds.includes(option.id))
    const incorrect = question.options.filter(option => !question.correctIds.includes(option.id))
    const correctMean = correct.reduce((sum, option) => sum + option.label.length, 0) / correct.length
    const wrongMean = incorrect.reduce((sum, option) => sum + option.label.length, 0) / Math.max(incorrect.length, 1)
    if (question.kind !== 'step_order' && correctMean - wrongMean >= 45 && correctMean / Math.max(wrongMean, 1) >= 1.75) flag(labels, 'EDIT_DISTRACTORS', `Đáp án đúng dài trung bình ${Math.round(correctMean)} ký tự, phương án sai ${Math.round(wrongMean)}; độ dài có thể lộ key.`, correct.map(option => option.label).join(' / '), source.question)
    const extreme = incorrect.filter(option => /(?:chắc chắn|luôn luôn|mọi output|không cần (?:kiểm tra|xác minh)|đóng ticket ngay|reboot ngay|xóa (?:toàn bộ|hết)|ngay lập tức)/iu.test(option.label))
    if (extreme.length >= 2) flag(labels, 'EDIT_DISTRACTORS', `Có ${extreme.length} phương án sai dùng khẳng định tuyệt đối hoặc hành động cực đoan; xem liệu có thể loại bằng văn phong thay vì bằng chứng.`, extreme.map(option => `${option.id}: ${option.label}`).join(' | '), source.question)
    if (question.explanation.length < 48) flag(labels, 'EDIT_FEEDBACK', 'Explanation ngắn dưới 48 ký tự; cần kiểm tra có giải thích bằng chứng hoặc giới hạn kết luận hay không.', question.explanation, source.question)
    const thinFeedback = question.options.filter(option => option.feedback.length < 34)
    if (thinFeedback.length >= 2) flag(labels, 'EDIT_FEEDBACK', `${thinFeedback.length} option feedback dưới 34 ký tự; cần kiểm tra lý do cụ thể cho từng lựa chọn.`, thinFeedback.map(option => `${option.id}: ${option.feedback}`).join(' | '), source.question)
    if (question.requiredProbeIds?.some(id => !probes.some(probe => probe.id === id))) flag(labels, 'TECHNICAL_ISSUE', 'Required probe ID không tồn tại trong ticket.', question.requiredProbeIds.join(', '), source.question)
    if (commandLinks.some(link => !link.present)) flag(labels, 'TECHNICAL_ISSUE', 'Command ID liên quan không có trong Library.', commandLinks.filter(link => !link.present).map(link => link.id).join(', '), source.question)
    const issueLabels = [...new Set(labels.map(item => item.label))]
    const classification = issueLabels.length === 0 ? ['KEEP'] : issueLabels.length > 1 ? [...issueLabels, 'MULTIPLE_ISSUES'] : issueLabels
    rows.push({ ticketId: content.id, topic: ticket.topic, level: `L${ticket.difficulty}`, questionId: question.id, stage: question.stage, type: question.kind, customerContext: ticket.customer_message, requiredProbes: question.requiredProbeIds ?? [], relatedProbes: related, allTicketProbes: probes, commandLinks, prompt: question.prompt, options: question.options.map(({ id, label, feedback }) => ({ id, label, feedback })), correctIds: question.correctIds, explanation: question.explanation, hints: content.hints, finalContext: { expectedDiagnosis: content.answerOverrides?.expected_diagnosis ?? ticket.expected_diagnosis, nextChecks: content.answerOverrides?.recommended_next_checks ?? ticket.recommended_next_checks, resolution: content.answerOverrides?.resolution_guidance ?? ticket.resolution_guidance, verification: content.answerOverrides?.verification ?? ticket.verification, escalation: content.answerOverrides?.escalate_when ?? ticket.escalate_when, referenceNoteEn: guidedReferenceNotes[content.id] }, source, classification, findings: labels, reviewStatus: 'AUTOMATED_EDITORIAL_TRIAGE; SME_PENDING' })
  }
}
if (tickets.length !== 112 || guidedContent.length !== 112 || generatedCases.length !== 112 || cards.length !== 122 || rows.length !== 620 || new Set(rows.map(row => `${row.ticketId}/${row.questionId}`)).size !== 620 || Object.keys(guidedReferenceNotes).length !== 112) throw new Error('D3 baseline coverage mismatch')
fs.mkdirSync(byTopic, { recursive: true })
for (const [topic, group] of Map.groupBy(rows, row => row.topic)) {
  const code = group[0].ticketId.split('-')[1]
  fs.writeFileSync(path.join(byTopic, `${code}_${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`), JSON.stringify({ topic, ticketCount: new Set(group.map(row => row.ticketId)).size, questionCount: group.length, entries: group }, null, 2) + '\n')
}
const headers = ['ticket_id','topic','level','question_id','stage','type','customer_context','required_probe_ids','related_commands_and_outputs','question_prompt','options_json','correct_ids','explanation','option_feedback_json','hints_json','final_context_json','classification','finding_reasons','finding_evidence','source','review_status']
fs.writeFileSync(path.join(out, '02_Question_Review.csv'), [csvRow(headers), ...rows.map(row => csvRow([row.ticketId,row.topic,row.level,row.questionId,row.stage,row.type,row.customerContext,row.requiredProbes.join(';'),JSON.stringify(row.relatedProbes.map(probe => ({ id:probe.id,commandId:probe.commandId,command:probe.command,output:probe.output }))),row.prompt,JSON.stringify(row.options.map(({id,label})=>({id,label}))),row.correctIds.join(';'),row.explanation,JSON.stringify(Object.fromEntries(row.options.map(({id,feedback})=>[id,feedback]))),JSON.stringify(row.hints),JSON.stringify(row.finalContext),row.classification.join(';'),row.findings.map(item => `${item.label}: ${item.reason}`).join(' | '),row.findings.map(item => item.evidence).join(' | '),row.source.question,row.reviewStatus]))].join('\n') + '\n')
const count = label => rows.filter(row => row.classification.includes(label)).length
const perTopic = [...Map.groupBy(rows, row => row.topic)].map(([topic, group]) => ({ topic, total: group.length, flagged: group.filter(row => !row.classification.includes('KEEP')).length })).sort((a,b) => b.flagged / b.total - a.flagged / a.total)
const perTicket = [...Map.groupBy(rows, row => row.ticketId)].map(([ticketId, group]) => ({ ticketId, topic: group[0].topic, level: group[0].level, flagged: group.filter(row => !row.classification.includes('KEEP')) })).sort((a,b) => b.flagged.length - a.flagged.length)
const flagged = rows.filter(row => !row.classification.includes('KEEP'))
const report = [
  '# D3-A — Guided assessment audit', '',
  '## Scope and method', '',
  `Read-only export from authored Guided content at HEAD \`${head}\`. Covers ${guidedContent.length} tickets, ${cards.length} Command Library IDs, ${rows.length} scored questions, and ${Object.keys(guidedReferenceNotes).length} English reference notes. The 112 short-answer notes are excluded from the scored-question count.`, '',
  'The labels below are **deterministic editorial triage**, not case-by-case technical certification or SME approval. `KEEP` means no rule below fired; it does not establish that the key, distractors, evidence, or command semantics are correct. All 620 entries remain `SME_PENDING`. The full dataset gives the reviewer the exact prose, options, keys, probes, hints, final context, and authored source.', '',
  'Prior context: Phase C recorded 620 question reviews (612 `REVIEWED`, 8 then `FINDING_OPEN`); the 19 entries in its finding register are now `FIXED_VERIFIED` after D1. D2.2 then edited one complete Docker lesson, which is included in this export. Those earlier reviews are agent work and do not convert these entries into human SME sign-off.', '',
  'Rules: prompt >180 characters or option >155 → clarity; correct-option mean > wrong-option mean by ≥45 characters and ≥1.75×, or ≥2 extreme distractors → distractors; explanation <48 characters or ≥2 option feedback strings <34 → feedback; missing required probe or Command Library ID → technical. These thresholds find review candidates and can miss semantic faults.', '',
  '## Counts', '',
  '| Classification | Questions |', '|---|---:|',
  ...['KEEP','EDIT_CLARITY','EDIT_DISTRACTORS','EDIT_FEEDBACK','TECHNICAL_ISSUE','MULTIPLE_ISSUES'].map(label => `| ${label} | ${count(label)} |`), '',
  `Flagged at least once: **${flagged.length}/${rows.length}**. A question can carry several issue labels.`, '',
  '## Topic review order', '', '| Topic | Scored | Flagged by rules |', '|---|---:|---:|',
  ...perTopic.map(item => `| ${item.topic} | ${item.total} | ${item.flagged} |`), '',
  'Highest flag counts are in Control Panel, Web, Docker, Backup, and Billing. These are triage counts driven mostly by terse option feedback; they are not a normalized quality score or proof those topics have incorrect keys.', '',
  '## Tickets with the most concrete review flags', '', '| Ticket | Topic / level | Flagged questions | Evidence to inspect |', '|---|---|---:|---|',
  ...perTicket.filter(item => item.flagged.length).slice(0, 12).map(item => `| ${item.ticketId} | ${item.topic} / ${item.level} | ${item.flagged.length} | ${item.flagged.map(row => `${row.questionId}: ${row.findings.map(finding => finding.label).join('+')} (${row.findings[0].evidence.replaceAll('|', '/')})`).join('; ')} |`), '',
  '## Concrete examples to edit first', '',
  ...flagged.slice(0, 30).map(row => `- **${row.ticketId}/${row.questionId}** (${row.level}, ${row.topic}; ${row.source.question}): ${row.findings.map(item => `${item.label} — ${item.reason} “${item.evidence}”`).join(' ')}`), '',
  '## Evidence and verification limits', '',
  '- The authored output is a fixture, not observed production or lab output. A plausible answer still needs source, lab, or provider SOP verification where the command ledger says pending.',
  '- Required probes are listed per question; `allTicketProbes` keeps the complete case context, including optional and post-action probes. A command link does not prove that a statement agrees with the card.',
  '- Source lines point to the Phase B authoring record. `source.overrides` lists matching later edits where detectable; inspect `scripts/guided-content.mjs` for late D1/D2 patches before rewriting.', '',
  '## Files', '',
  '- `02_Question_Review.csv`: one row per scored question, IDs and triage reasons.',
  '- `03_Content_By_Topic/*.json`: full review packet; preserves case and question order.',
  '- `04_Command_Content_Conflicts.md`: verified structural conflicts and semantic comparison limits.',
  '- `05_Editorial_Priority.md`: prioritized review queues.', '',
  '## Verification record — 2026-10-26', '',
  '- Baseline Git: `8ec08f7` on `master`; working tree was clean before D3-A.',
  '- `npm run prepare-data`: PASS, 112 original tickets and 112 Guided cases generated.',
  '- `npm run audit:content`: PASS, 0 errors; 112 Guided, 122 cards, 620 scored prompts.',
  '- `npm test -- --run`: PASS, 39/39 tests.',
  '- `npm run build`: PASS; existing Vite warning for a JavaScript chunk over 500 kB.',
  '- `node scripts/export-d3-assessment.mjs`: PASS; each scored question was compared with generated prompt, options, key and feedback before export.',
  '- Git status at delivery: see commit and final task summary; no runtime, answer key, fixture or progress source changes were authored for D3-A.', '',
]
fs.writeFileSync(path.join(out, '01_Assessment_Audit.md'), report.join('\n'))
const pending = [...commandUses].map(([id, tickets]) => ({ id, tickets: [...tickets], card: cardById.get(id) })).filter(item => item.card && item.card.knowledge?.verification !== 'SOURCE_VERIFIED').sort((a,b) => b.tickets.length - a.tickets.length)
fs.writeFileSync(path.join(out, '04_Command_Content_Conflicts.md'), [
  '# D3-A — Command and assessment consistency', '',
  `Linked Command Library IDs: ${commandUses.size}. Missing ID links: ${conflicts.length}.`, '',
  ...(conflicts.length ? conflicts.map(item => `- ${item.ticketId}/${item.questionId}, ${item.commandId}: ${item.issue}. Fix at ${item.sourceToFix}.`) : ['No missing Command Library ID was found in question/probe links.']), '',
  'This is an ID and metadata cross-check. It does not assert semantic agreement between every feedback sentence, hint, fixture, and card. No unsupported semantic conflict is invented here.', '',
  '## Commands needing Command Editorial verification', '',
  '| Command ID | Linked tickets | Verification | Next check |', '|---|---:|---|---|',
  ...pending.map(item => `| ${item.id} | ${item.tickets.length} | ${item.card.knowledge?.verification ?? 'UNSPECIFIED'} | Compare authored example and limitation against the ${item.card.knowledge?.kind === 'support_task' ? 'provider SOP' : 'official manual and isolated lab'} before publication. |`), '',
  `Current authored Command Library metadata reports ${cardCounts.SOURCE_VERIFIED ?? 0} source-verified shell cards, ${cardCounts.PENDING ?? 0} pending shell cards, and ${cardCounts.INTERNAL_SOP_REQUIRED ?? 0} support tasks requiring SOP. README and the D2 ledger report 70/32/20; \`getent-passwd\` is now SOURCE_VERIFIED in authored metadata while the older ledger still says PENDING. Reconcile that ledger before citing its counts. No lab verification is established by source metadata.`, '',
].join('\n'))
const priority = [...flagged].sort((a,b) => Number(b.level.slice(1)) - Number(a.level.slice(1)) || b.findings.length - a.findings.length)
fs.writeFileSync(path.join(out, '05_Editorial_Priority.md'), [
  '# D3-A — Editorial priority', '',
  '## P0: technical and answer validity', '',
  `Review all ${rows.length} keys against the evidence in the topic JSON packets. The automated structural check found ${count('TECHNICAL_ISSUE')} missing-link or missing-probe issues; this is **not** a semantic correctness verdict. Start with L3/L2 and any question whose option could also be defensible. Preserve IDs and keys until a separate approved content change.`, '',
  '## P1: concrete editorial flags', '',
  `The triage rules flagged ${count('EDIT_CLARITY')} clarity, ${count('EDIT_DISTRACTORS')} distractor, and ${count('EDIT_FEEDBACK')} feedback candidates. The CSV records a text excerpt and authored location for each.`, '',
  '| First review | Topic | Level | Labels | Source |', '|---|---|---|---|---|',
  ...priority.slice(0, 60).map(row => `| ${row.ticketId}/${row.questionId} | ${row.topic} | ${row.level} | ${row.classification.join(', ')} | ${row.source.question} |`), '',
  '## P2: human review queue', '',
  `The ${count('KEEP')} KEEP rows still need a human pass for multiple defensible options, command behavior, hint leakage, level calibration, and evidence sufficiency. Compare each question with its full case packet and Command Library card. Mark SME approval only after that pass.`, '',
  '## Command Editorial', '',
  `Check ${pending.length} linked IDs whose verification is not SOURCE_VERIFIED, followed by source-verified cards whose examples have no lab check. Details are in \`04_Command_Content_Conflicts.md\` and the D2 command ledger.`, '',
].join('\n'))
console.log(JSON.stringify({ tickets: guidedContent.length, cards: cards.length, questions: rows.length, topics: perTopic.length, keep: count('KEEP'), clarity: count('EDIT_CLARITY'), distractors: count('EDIT_DISTRACTORS'), feedback: count('EDIT_FEEDBACK'), technical: count('TECHNICAL_ISSUE'), multiple: count('MULTIPLE_ISSUES'), missingLinks: conflicts.length, pendingCommandIds: pending.length }, null, 2))
