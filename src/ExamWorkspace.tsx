import { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, Check, ShieldCheck } from 'lucide-react'
import { answerUrl, DEFAULT_RUBRIC, emptyChecks, emptyExamDraft, isAnswer, isInvestigation, matchProbeForKind, scoreChecks, SCORE_KEYS, SCORE_LABELS } from './lib'
import { classifyGuidedCommand } from './guided/engine'
import { commandLibrary } from './guided/commands'
import { examMissing } from './exam'
import type { Answer, CommandEntry, ExamAttempt, ExamDraft, Progress, Ticket } from './types'

const fields: { key: keyof ExamDraft['form']; title: string; hint: string }[] = [
  { key: 'symptom', title: 'Triệu chứng và phạm vi', hint: 'Khách hàng không làm được gì? Điều gì vẫn hoạt động?' },
  { key: 'hypothesis', title: 'Giả thuyết và mức chắc chắn', hint: 'Điều gì có thể giải thích tình huống? Còn thiếu bằng chứng gì?' },
  { key: 'evidence', title: 'Bằng chứng đã quan sát', hint: 'Trích P1/P2 và giải thích output chứng minh điều gì.' },
  { key: 'action', title: 'Xử lý an toàn hoặc escalation', hint: 'Nêu bước tiếp, quyền cần có, rủi ro và khi nào chuyển cấp.' },
  { key: 'verification', title: 'Xác minh', hint: 'Kiểm tra gì từ guest/client/panel để biết sự cố đã hết?' },
]

export function ExamWorkspace({ ticket, progress, setProgress, onBack }: { ticket: Ticket; progress: Progress; setProgress: React.Dispatch<React.SetStateAction<Progress>>; onBack: () => void }) {
  const draft = progress.examDrafts[ticket.id] ?? emptyExamDraft()
  const attempt = draft.submittedAttemptId ? progress.examAttempts.find(item => item.id === draft.submittedAttemptId && item.ticketId === ticket.id) : undefined
  const [input, setInput] = useState('')
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const panelTasks = ticket.probe_outputs.filter(probe => isInvestigation(probe.command))
  useEffect(() => { setInput(''); setAnswer(null); setError('') }, [ticket.id])
  useEffect(() => {
    if (!attempt || answer) return
    let active = true
    fetch(answerUrl(ticket.id)).then(response => { if (!response.ok) throw new Error('Answer unavailable'); return response.json() }).then((data: unknown) => { if (!isAnswer(data)) throw new Error('Invalid answer'); if (active) setAnswer(data) }).catch(() => { if (active) setError('Không tải được đáp án; ghi chú và lượt nộp vẫn được giữ.') })
    return () => { active = false }
  }, [attempt, answer, ticket.id])
  function updateDraft(patch: Partial<ExamDraft> | ((current: ExamDraft) => Partial<ExamDraft>)) {
    setProgress(current => { const previous = current.examDrafts[ticket.id] ?? emptyExamDraft(); return { ...current, examDrafts: { ...current.examDrafts, [ticket.id]: { ...previous, ...(typeof patch === 'function' ? patch(previous) : patch) } } } })
  }
  function runProbe(value = input) {
    if (!value.trim() || attempt) return
    const kind = isInvestigation(value) ? 'investigation' : 'terminal'
    const probe = matchProbeForKind(ticket.probe_outputs, value, kind)
    const classification = !probe && kind === 'terminal' ? classifyGuidedCommand(value, [], commandLibrary) : null
    const entry: CommandEntry = { id: crypto.randomUUID(), probeId: probe?.probe_id, command: value.trim(), output: probe?.stdout ?? (classification && 'message' in classification ? classification.message : 'Tác vụ này chưa có dữ liệu mô phỏng cho ticket này.'), supported: !!probe, kind, at: new Date().toISOString() }
    updateDraft(current => ({ commands: [...current.commands, entry] }))
    setInput('')
  }
  function cite(entry: CommandEntry) {
    if (!entry.supported || !entry.probeId || attempt) return
    const line = `${entry.probeId} (${entry.command}): ${entry.output}`
    updateDraft(current => ({ form: { ...current.form, evidence: current.form.evidence.includes(line) ? current.form.evidence : [current.form.evidence.trim(), line].filter(Boolean).join('\n') } }))
  }
  async function submit() {
    if (attempt || busy) return
    const missing = examMissing(draft, ticket)
    if (missing.length) { setError(`Chưa thể nộp: ${missing.join('; ')}.`); return }
    setBusy(true); setError('')
    try {
      const response = await fetch(answerUrl(ticket.id))
      if (!response.ok) throw new Error('Không tải được đáp án.')
      const data: unknown = await response.json()
      if (!isAnswer(data)) throw new Error('Đáp án không hợp lệ.')
      const id = crypto.randomUUID()
      const submitted: ExamAttempt = { id, ticketId: ticket.id, createdAt: new Date().toISOString(), form: { ...draft.form }, commands: [...draft.commands] }
      setProgress(current => ({ ...current, examAttempts: [submitted, ...current.examAttempts], examDrafts: { ...current.examDrafts, [ticket.id]: { ...(current.examDrafts[ticket.id] ?? draft), submittedAttemptId: id } } }))
      setAnswer(data)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không nộp được bài.') }
    finally { setBusy(false) }
  }
  function updateCheck(key: keyof ReturnType<typeof emptyChecks>, checked: boolean) {
    if (!attempt || !answer) return
    const checks = { ...(attempt.checks ?? emptyChecks()), [key]: checked }
    const selfScore = scoreChecks(checks, answer.scoring_rubric ?? DEFAULT_RUBRIC)
    setProgress(current => ({ ...current, examAttempts: current.examAttempts.map(item => item.id === attempt.id ? { ...item, checks, selfScore } : item) }))
  }
  function newRound() { if (attempt) { updateDraft({ ...emptyExamDraft(), submittedAttemptId: undefined }); setAnswer(null); setError('') } }
  return <section className="exam-page">
    <div className="page-heading"><div><button className="guided-back" onClick={onBack}><ArrowLeft size={15} /> Về ticket</button><h1>Legacy Exam · {ticket.id}</h1><p>Bài tự đánh giá cho mọi ticket. Gợi ý, đáp án và danh sách command được giấu tới khi nộp; điểm rubric do bạn tự chấm.</p></div><div className="progress-summary"><ShieldCheck size={15} /> Chỉ fixture JSON</div></div>
    <div className="exam-layout"><div className="exam-main">
      <section className="case-card"><div className="case-overline">LỜI KHÁCH HÀNG</div><p className="exam-customer">{ticket.customer_message}</p><div className="case-info"><div><span>Guest OS</span><strong>{ticket.guest_os}</strong></div><div><span>Môi trường</span><strong>{ticket.environment}</strong></div></div></section>
      <section className="case-card"><h2>Điều tra</h2><p>Nhập command terminal; tác vụ panel/billing có thể chọn trực tiếp nếu case hỗ trợ. Chỉ fixture của ticket mới có output. Không có lệnh nào được chạy thật.</p>{!attempt && panelTasks.length > 0 && <div className="exam-panel-tasks"><strong>Tác vụ ngoài terminal</strong><div>{panelTasks.map(probe => <button key={probe.probe_id} onClick={() => runProbe(probe.command)}>{probe.command}</button>)}</div></div>}<div className="exam-terminal">{draft.commands.length ? draft.commands.map(entry => <div key={entry.id}><code>{entry.kind === 'terminal' ? '$ ' : ''}{entry.command} {entry.probeId ?? ''}</code><pre>{entry.output}</pre>{entry.supported && !attempt && <button className="cite-button" onClick={() => cite(entry)}>Trích vào bằng chứng</button>}</div>) : <p>Chưa có phép kiểm tra.</p>}</div>{!attempt && <form className="guided-command" onSubmit={event => { event.preventDefault(); runProbe() }}><input aria-label="Nhập phép kiểm tra Exam" value={input} onChange={event => setInput(event.target.value)} placeholder="Nhập command hoặc tác vụ..." spellCheck={false} /><button disabled={!input.trim()}>Kiểm tra</button></form>}</section>
      <section className="case-card"><h2>Ghi nhận định</h2><p>Phân biệt quan sát, giả thuyết và đề xuất. Bài Exam được tự đối chiếu theo rubric; không chấm đúng sai tự động từ văn bản.</p><div className="exam-form">{fields.map(field => <label key={field.key}><strong>{field.title}</strong><textarea rows={3} value={draft.form[field.key]} onChange={event => updateDraft(current => ({ form: { ...current.form, [field.key]: event.target.value } }))} disabled={!!attempt} placeholder={field.hint} /></label>)}</div>{error && <div className="notice error" role="alert">{error}</div>}{!attempt ? <button className="primary-button" disabled={busy} onClick={submit}>{busy ? 'Đang nộp...' : 'Nộp bài và mở đáp án'}</button> : <div className="notice"><Check size={16} /> Đã nộp lúc {new Date(attempt.createdAt).toLocaleString('vi-VN')}. Bản làm được lưu trong lịch sử.</div>}</section>
      {attempt && answer && <section className="case-card answer-card"><div className="answer-banner"><BookOpen size={20} /><div><h2>Đối chiếu đáp án</h2><p>So sánh với ghi chú đã nộp; đây là hướng dẫn fixture, không phải chẩn đoán production.</p></div></div><div className="answer-grid"><AnswerRow title="Chẩn đoán dự kiến" text={answer.expected_diagnosis} /><AnswerRow title="Kiểm tra tiếp" text={answer.recommended_next_checks} /><AnswerRow title="Hướng xử lý" text={answer.resolution_guidance} /><AnswerRow title="Xác minh" text={answer.verification} /><AnswerRow title="Escalation" text={answer.escalate_when} /></div><div className="warning">{answer.production_warning}</div><div className="rubric"><h3>Tự đánh giá sau khi đối chiếu · {attempt.selfScore === undefined ? 'chưa chấm' : `${attempt.selfScore}/10`}</h3><p>Điểm tự chấm không tạo trạng thái Mastered.</p><div className="rubric-list">{SCORE_KEYS.map(key => <label key={key}><input type="checkbox" checked={attempt.checks?.[key] ?? false} onChange={event => updateCheck(key, event.target.checked)} /><span>{SCORE_LABELS[key]}</span><b>+{answer.scoring_rubric[key]}</b></label>)}</div></div><button className="guided-secondary" onClick={newRound}>Bắt đầu lượt Exam mới</button></section>}
    </div><aside className="exam-side"><div className="guided-card"><h3>Tiến độ bài Exam</h3><p>{new Set(draft.commands.filter(entry => entry.supported).map(entry => entry.probeId)).size}/2 fixture đã xem</p><p>{fields.filter(field => draft.form[field.key].trim()).length}/5 phần ghi chú đã bắt đầu</p><p>{attempt ? 'Đã nộp' : 'Đang làm · tự động lưu'}</p></div></aside></div>
  </section>
}

function AnswerRow({ title, text }: { title: string; text: string }) { return <div className="answer-item"><span>{title}</span><p>{text}</p></div> }

