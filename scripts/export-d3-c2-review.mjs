// Rebuild the C2 editorial ledgers from the effective authoring output.
// These are agent review records, never SME, lab or provider-SOP approvals.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { loadCommandLibrary } from './content/load-command-library.mjs'

const root = path.resolve(import.meta.dirname, '..')
const out = path.join(root, 'audit/phase-d3-c2')
fs.mkdirSync(out, { recursive: true })
const base = '9e41f7b'
const read = filename => fs.readFileSync(path.join(root, filename), 'utf8')
const old = filename => execFileSync('git', ['show', `${base}:${filename.replaceAll('\\', '/')}`], { cwd: root, encoding: 'utf8', maxBuffer: 40_000_000 })
const json = filename => JSON.parse(read(filename))
const oldJson = filename => JSON.parse(old(filename))
const normalize = value => JSON.stringify(value)
const excerpt = (value, limit = 240) => String(value ?? '').replace(/\s+/g, ' ').slice(0, limit)
const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`
const writeCsv = (filename, headings, rows) => fs.writeFileSync(path.join(out, filename), [headings, ...rows].map(row => row.map(csvCell).join(',')).join('\n') + '\n')

function parseCsv(source) {
  const result = []; let row = [], field = '', quoted = false
  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    if (quoted && char === '"' && source[i + 1] === '"') { field += '"'; i++ }
    else if (char === '"') quoted = !quoted
    else if (!quoted && char === ',') { row.push(field); field = '' }
    else if (!quoted && char === '\n') { row.push(field); result.push(row); row = []; field = '' }
    else if (char !== '\r') field += char
  }
  if (field || row.length) { row.push(field); result.push(row) }
  const [rawHeadings, ...records] = result
  const headings = rawHeadings.map(name => name.replace(/^\uFEFF/, ''))
  return records.map(values => Object.fromEntries(headings.map((name, index) => [name, values[index] ?? ''])))
}

const currentCases = json('src/data/guided-public.json')
const baselineCases = oldJson('src/data/guided-public.json')
const oldCases = new Map(baselineCases.map(item => [item.id, item]))
const cards = await loadCommandLibrary(root)
const d3Rows = fs.readdirSync(path.join(root, 'audit/phase-d3/03_Content_By_Topic')).flatMap(file => json(`audit/phase-d3/03_Content_By_Topic/${file}`).entries)
const d3 = new Map(d3Rows.map(entry => [`${entry.ticketId}/${entry.questionId}`, entry]))
const screening = new Map(parseCsv(read('audit/phase-d3-c2/inputs/TicketSim_D3_Question_Screening.csv')).map(item => [`${item.ticket_id}/${item.question_id}`, item]))
const commandScreen = new Map(parseCsv(read('audit/phase-d3-c2/inputs/TicketSim_D3_Command_Screening.csv')).map(item => [item.command_id, item]))
if (screening.size !== 620 || commandScreen.size !== 122 || !screening.has('VPS-01-001/triage') || !commandScreen.has('iostat')) {
  throw new Error(`Independent screening join failed: ${screening.size} questions, ${commandScreen.size} commands`)
}
const c1Command = new Map(parseCsv(read('audit/phase-d3/07_Command_Expert_Review.csv')).map(item => [item.command_id, item]))
const c2RevisionIds = new Set(['VPS-01-008', 'VPS-02-008', 'VPS-04-001', 'VPS-04-004', 'VPS-04-006', 'VPS-04-008', 'VPS-05-005', 'VPS-09-007', 'VPS-13-008', 'VPS-14-006'])
const majorQuestionReasons = {
  'VPS-01-008/check': 'Giới hạn câu hỏi vào kernel log của boot này; tail 30 dòng không cam kết bao trùm cửa sổ job.',
  'VPS-04-006/output': 'Prompt cũ hỏi điều chưa chứng minh nhưng khóa chọn diễn giải phù hợp; đổi mục tiêu câu hỏi để chỉ còn một đáp án đúng.',
  'VPS-04-008/check': 'Lệnh Guided thêm --utc, giữ ngày và đầu vào UTC; output lịch sử vẫn là fixture gốc.',
  'VPS-09-007/check': 'Lệnh Guided thêm --utc để timestamp hiển thị khớp cửa sổ auth incident UTC.',
  'VPS-14-006/output': 'Phân biệt lịch xóa ngày 25/10 với job đã hoàn tất và hold thực tế tại mốc tiếp nhận 22/10.',
  'VPS-14-006/decision': 'Yêu cầu owner và Billing/Lifecycle phê duyệt hold có audit; sau hạn phải kiểm tra job hiện tại.',
  'VPS-04-001/output': 'Thay kết luận python3 độc hại bằng bẫy thời gian đo: mẫu top/ps chưa xác định duy nhất nguyên nhân toàn bộ incident.',
  'VPS-04-004/output': 'Thay kết luận ổ vật lý hỏng bằng lựa chọn thay ổ quá sớm; cần so guest/host và health telemetry.',
  'VPS-04-004/decision': 'Thay hành động xóa dữ liệu hiển nhiên sai bằng đề xuất chuyển storage node quá sớm khi chỉ có một mẫu.',
  'VPS-05-005/output': 'Phân biệt disk 40G với partition và filesystem 20G; các lựa chọn sai nay là nhầm lớp grow/cache.',
  'VPS-13-008/output': 'Các phương án sai đề nghị rollback hoặc bỏ config option khi chưa xác minh migration và release.',
  'VPS-13-008/decision': 'Đề nghị rollback trước khi kiểm tra data là sai ở thứ tự; container Up không xác nhận chức năng.',
}
const questionHead = ['ticket_id','question_id','topic','level','question_type','screening_flags','before_prompt','after_prompt','before_options_json','after_options_json','before_feedback_json','after_feedback_json','checked_fields','review_decision','review_reason','case_evidence','source_location','answer_key_status','content_revision_impact','review_type','sme_status']
const questionRows = []
let editedQuestions = 0, keyChanges = 0
for (const item of currentCases) {
  const beforeCase = oldCases.get(item.id)
  if (!beforeCase) throw new Error(`Missing baseline case ${item.id}`)
  for (const question of item.questions) {
    if (question.kind === 'short_answer') continue
    const id = `${item.id}/${question.id}`
    const before = beforeCase.questions.find(row => row.id === question.id)
    if (!before) throw new Error(`Missing baseline question ${id}`)
    const prior = oldJson(`public/guided-feedback/${item.id}/${question.id}.json`)
    const after = json(`public/guided-feedback/${item.id}/${question.id}.json`)
    const changed = before.prompt !== question.prompt || normalize(before.options) !== normalize(question.options) || prior.explanation !== after.explanation || normalize(prior.optionFeedback) !== normalize(after.optionFeedback)
    if (changed) editedQuestions++
    const keyChanged = normalize(prior.correctIds) !== normalize(after.correctIds)
    if (keyChanged) keyChanges++
    const entry = d3.get(id)
    const flags = screening.get(id)?.screening_flags ?? ''
    const correctLabels = question.options.filter(option => after.correctIds.includes(option.id)).map(option => option.label).join(' / ')
    const wrongFeedback = Object.entries(after.optionFeedback).filter(([optionId]) => !after.correctIds.includes(optionId)).map(([optionId, message]) => `${optionId}: ${message}`).join(' | ')
    const reason = majorQuestionReasons[id] ?? (changed
      ? `Đã chỉnh câu chữ/feedback sau đối chiếu output; khóa giữ ${after.correctIds.join('+')}. Đáp án được hỗ trợ: ${excerpt(correctLabels, 120)}.`
      : `Giữ khóa ${after.correctIds.join('+')}: ${excerpt(correctLabels, 140)}. Phương án sai được phân biệt: ${excerpt(wrongFeedback, 190)}.`)
    const evidence = question.id === 'triage' ? entry?.customerContext
      : question.id === 'check' ? entry?.allTicketProbes?.[0]?.command
      : ['output', 'evidence'].includes(question.id) ? entry?.allTicketProbes?.slice(0, 2).map(probe => `${probe.id} ${excerpt(probe.output, 110)}`).join(' | ')
      : excerpt(entry?.finalContext?.expectedDiagnosis ?? '', 170)
    questionRows.push([item.id, question.id, entry?.topic ?? '', entry?.level ?? '', question.kind, flags, before.prompt, question.prompt, normalize(before.options), normalize(question.options), normalize({explanation:prior.explanation, optionFeedback:prior.optionFeedback}), normalize({explanation:after.explanation, optionFeedback:after.optionFeedback}), 'prompt; all options; answer key; per-option feedback; explanation; related probes; hints; final guidance', changed ? 'AGENT_REVISED' : 'AGENT_REVIEWED_NO_CHANGE', reason, evidence, entry?.source?.question ?? '', keyChanged ? 'CHANGED_REQUIRES_FINDING' : 'UNCHANGED', c2RevisionIds.has(item.id) ? 'C2_CASE_REVISION' : 'NO_SEMANTIC_REVISION', 'AGENT_SEMANTIC_REVIEW', 'SME_PENDING'])
  }
}
if (questionRows.length !== 620 || keyChanges !== 0) throw new Error(`Question coverage/key mismatch: ${questionRows.length}, ${keyChanges}`)
writeCsv('02_Question_Editorial_Review.csv', questionHead, questionRows)

const commandHead = ['command_id','family','kind','screening_flags','source_verification','syntax_status','options_status','example_output_status','interpretation_status','safety_permissions_status','distro_version_status','documentation_urls','lab_verification','sop_verification','changes_made','remaining_gap_reason','source_location','review_decision','review_type','sme_status']
const commandRows = []
for (const card of cards) {
  const knowledge = card.knowledge
  const support = knowledge.kind === 'support_task'
  const c1 = c1Command.get(card.id)
  if (!c1) throw new Error(`Missing C1 command ${card.id}`)
  const status = value => support ? value : 'AGENT_CONTENT_REVIEWED; LAB_PENDING'
  const gap = support ? `Cần SOP provider cho ${card.purpose}; panel output là fixture mô phỏng, chưa xác minh thao tác thật.`
    : knowledge.verification === 'PENDING' ? `D2 source PENDING: ${c1.review_reason || card.pitfalls} Cần xác minh whole-card theo distro/version; lab chưa chạy.`
    : 'D2 source metadata retained; output/version on supported images and permissions require lab.'
  commandRows.push([
    card.id, card.family, knowledge.kind, commandScreen.get(card.id)?.screening_flags ?? '', knowledge.verification,
    status('NOT_APPLICABLE_SUPPORT_TASK'), support || !knowledge.options.length ? 'NOT_APPLICABLE' : status(''),
    support ? 'FIXTURE_REVIEWED; SOP_PENDING' : status(''),
    support ? 'AGENT_SCOPE_REVIEWED; SOP_PENDING' : status(''),
    support ? 'AGENT_SCOPE_REVIEWED; SOP_PENDING' : status(''),
    support ? 'NOT_APPLICABLE; SOP_PENDING' : status(''),
    knowledge.sourceUrls.join(' | '), 'LAB_PENDING', support ? 'SOP_PENDING' : 'NOT_APPLICABLE',
    card.id === 'iostat' ? 'Bổ sung -y và ví dụ chỉ đọc mẫu interval; giữ ví dụ mặc định có báo cáo đầu từ boot.' : '',
    gap, c1.card_source, card.id === 'iostat' ? 'AGENT_REVISED' : 'AGENT_REVIEWED_NO_CHANGE', 'AGENT_TECHNICAL_CONTENT_REVIEW', 'SME_PENDING'
  ])
}
if (commandRows.length !== 122 || cards.filter(card => card.knowledge.kind === 'support_task').length !== 20) throw new Error('Command coverage mismatch')
writeCsv('03_Command_Technical_Review.csv', commandHead, commandRows)

const noteHead = ['ticket_id','before_note','after_note','checked_fields','review_decision','review_reason','evidence','source_location','sme_status']
const noteRows = []
let editedNotes = 0
for (const item of currentCases) {
  const file = `public/guided-answers/${item.id}.json`
  const before = oldJson(file).referenceNoteEn
  const after = json(file).referenceNoteEn
  const changed = before !== after
  if (changed) editedNotes++
  noteRows.push([item.id, before, after, 'Issue; Findings; Next Action; Verification; Status; evidence scope; authorization; natural English', changed ? 'AGENT_REVISED' : 'AGENT_REVIEWED_NO_CHANGE',
    changed ? 'Đã sửa mức kết luận, hành động hoặc mốc xác minh cho khớp fixture và Guided case.' : 'Năm trường đủ rõ, không tuyên bố thao tác chưa làm hoặc root cause ngoài bằng chứng.',
    excerpt(item.probes.slice(0,2).map(probe => `${probe.id}: ${probe.output}`).join(' | '), 250), 'scripts/guided-reference-notes.mjs', 'SME_PENDING'])
}
if (noteRows.length !== 112) throw new Error('English note coverage mismatch')
writeCsv('07_English_Notes_Review.csv', noteHead, noteRows)
console.log(JSON.stringify({questions: questionRows.length, editedQuestions, keyChanges, commands: commandRows.length, editedCommands: 1, notes: noteRows.length, editedNotes}, null, 2))
