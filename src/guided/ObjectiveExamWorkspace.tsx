import { useEffect, useState } from 'react'
import type { ObjectiveExamDraft, Progress, Ticket } from '../types'
import { commandLibrary } from './commands'
import { runStatefulFixture, emptyStatefulDraft } from './stateful'
import { emptyObjectiveExamDraft, gradeObjectiveExam, objectiveExamQuestions, objectiveExamReady } from './objective'
import type { GuidedAnswerKey, GuidedCase, GuidedQuestion } from './types'

type Props = { ticket: Ticket; guidedCase: GuidedCase; progress: Progress; setProgress: React.Dispatch<React.SetStateAction<Progress>>; onBack: () => void }
export function ObjectiveExamWorkspace({ ticket, guidedCase, progress, setProgress, onBack }: Props) {
  const draft = progress.objectiveExamDrafts[ticket.id] ?? emptyObjectiveExamDraft()
  const attempt = draft.submittedAttemptId ? progress.objectiveExamAttempts.find(item => item.id === draft.submittedAttemptId) : undefined
  const questions = objectiveExamQuestions(guidedCase)
  const [keys, setKeys] = useState<Record<string, GuidedAnswerKey>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const evidenceReady = ['P1', 'P2'].every(id => draft.commands.some(entry => entry.supported && entry.probeId === id))
  useEffect(() => { setKeys({}); setError('') }, [ticket.id, attempt?.id])
  useEffect(() => {
    if (!attempt) return
    let active = true
    Promise.all(questions.map(async question => { const path = question.id === 'exam-verify' ? `objective-feedback/${ticket.id}/exam-verify.json` : `guided-feedback/${ticket.id}/${question.id}.json`; const response = await fetch(`${import.meta.env.BASE_URL}${path}`); if (!response.ok) throw new Error('Không tải được feedback.'); return [question.id, await response.json()] as const })).then(entries => { if (active) setKeys(Object.fromEntries(entries)) }).catch(() => { if (active) setError('Không tải được giải thích đáp án; điểm và lượt nộp vẫn được giữ.') })
    return () => { active = false }
  }, [attempt?.id, ticket.id])
  function update(patch: Partial<ObjectiveExamDraft> | ((previous: ObjectiveExamDraft) => Partial<ObjectiveExamDraft>)) {
    setProgress(current => { const previous = current.objectiveExamDrafts[ticket.id] ?? emptyObjectiveExamDraft(); return { ...current, objectiveExamDrafts: { ...current.objectiveExamDrafts, [ticket.id]: { ...previous, ...(typeof patch === 'function' ? patch(previous) : patch) } } } })
  }
  function inspect(probeId: string) {
    if (attempt) return
    const probe = guidedCase.probes.find(item => item.id === probeId)
    if (!probe) return
    const { entry } = runStatefulFixture(probe.command, guidedCase, commandLibrary, emptyStatefulDraft())
    update(current => ({ commands: [...current.commands, entry] }))
  }
  async function submit() {
    if (attempt || busy || !objectiveExamReady(guidedCase, draft)) return
    setBusy(true); setError('')
    try {
      const keys: Record<string, GuidedAnswerKey> = {}
      for (const question of questions) {
        const path = question.id === 'exam-verify' ? `objective-feedback/${ticket.id}/exam-verify.json` : `guided-feedback/${ticket.id}/${question.id}.json`
        const response = await fetch(`${import.meta.env.BASE_URL}${path}`)
        if (!response.ok) throw new Error('Không tải được đáp án khách quan.')
        keys[question.id] = await response.json() as GuidedAnswerKey
      }
      const graded = gradeObjectiveExam(guidedCase, draft, keys, new Date().toISOString(), crypto.randomUUID())
      setProgress(current => ({ ...current, objectiveExamAttempts: [graded, ...current.objectiveExamAttempts], objectiveExamDrafts: { ...current.objectiveExamDrafts, [ticket.id]: { ...(current.objectiveExamDrafts[ticket.id] ?? draft), submittedAttemptId: graded.id } } }))
      setKeys(keys)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không chấm được bài.') }
    finally { setBusy(false) }
  }
  return <section className="objective-page"><div className="page-heading"><div><button className="guided-back" onClick={onBack}>← Về ticket</button><h1>Objective Exam · {ticket.id}</h1><p>6 câu chấm bằng đáp án biên soạn; ghi chú tự do không được chấm bằng từ khóa. Đây là điểm hệ thống xác minh cho câu chọn đáp án.</p></div><div className="progress-summary">{attempt ? `${attempt.score}/${attempt.total} · khách quan` : 'Đang làm · tự động lưu'}</div></div>
    <div className="guided-layout"><div className="guided-main"><section className="guided-card guided-ticket"><span className="guided-kicker">LỜI KHÁCH HÀNG</span><p>{ticket.customer_message}</p></section>
      {questions.filter(question => ['triage', 'check'].includes(question.id)).map(question => <ExamQuestion key={question.id} question={question} draft={draft} attempt={attempt} answer={keys[question.id]} onSelect={selected => update(current => ({ responses: { ...current.responses, [question.id]: selected } }))} />)}
      <section className="guided-card"><h2>Đọc bằng chứng fixture</h2><p>Chọn phép kiểm tra rồi đọc chính xác P1/P2. Output dưới đây là dữ liệu tác giả, không chạy lệnh trên VPS.</p><div className="stateful-actions">{guidedCase.probes.filter(probe => ['P1', 'P2'].includes(probe.id)).map(probe => <button key={probe.id} disabled={!!attempt} onClick={() => inspect(probe.id)}>{probe.id} · {probe.command} <small>{probe.context}</small></button>)}</div><div className="guided-output">{draft.commands.map(entry => <div key={entry.id}><code>{entry.probeId} · {entry.command}</code><pre>{entry.output}</pre></div>)}</div></section>
      {evidenceReady && questions.filter(question => !['triage', 'check'].includes(question.id)).map(question => <ExamQuestion key={question.id} question={question} draft={draft} attempt={attempt} answer={keys[question.id]} onSelect={selected => update(current => ({ responses: { ...current.responses, [question.id]: selected } }))} />)}
      {error && <div className="notice error" role="alert">{error}</div>}{!attempt ? <button className="primary-button" disabled={busy || !objectiveExamReady(guidedCase, draft)} onClick={submit}>{busy ? 'Đang chấm...' : 'Nộp Objective Exam'}</button> : <div className="guided-card"><h2>Kết quả {attempt.score}/{attempt.total}</h2><p>Các câu sai và loại lỗi đã được đưa vào Review Mistakes. Điểm này chỉ áp dụng cho 6 câu chọn đáp án, không chứng minh năng lực xử lý VPS thực tế.</p><button className="guided-secondary" onClick={() => { update(emptyObjectiveExamDraft()); setKeys({}) }}>Lượt mới</button></div>}
    </div><aside className="guided-side"><div className="guided-card"><h3>Phạm vi chấm</h3><p>Triệu chứng · command · output · bằng chứng · quyết định · xác minh/escalation.</p><p>Legacy Exam tự đánh giá vẫn có cho toàn bộ 112 ticket.</p></div></aside></div>
  </section>
}

function ExamQuestion({ question, draft, attempt, answer, onSelect }: { question: GuidedQuestion; draft: ObjectiveExamDraft; attempt?: Progress['objectiveExamAttempts'][number]; answer?: GuidedAnswerKey; onSelect: (selected: string[]) => void }) {
  const selected = draft.responses[question.id] ?? []
  const multiple = question.kind === 'multi_select'
  const correct = attempt?.outcomes[question.id]
  return <section className="guided-card guided-question"><div className="guided-question-top"><span>{question.stage.toUpperCase()}</span>{attempt && <strong className={correct ? 'correct' : 'incorrect'}>{correct ? 'Đúng' : 'Cần ôn'}</strong>}</div><h2>{question.prompt}</h2><div className="guided-options">{question.options.map(option => <label key={option.id} className={selected.includes(option.id) ? 'selected' : ''}><input type={multiple ? 'checkbox' : 'radio'} name={`objective-${question.id}`} checked={selected.includes(option.id)} disabled={!!attempt} onChange={() => onSelect(multiple ? selected.includes(option.id) ? selected.filter(id => id !== option.id) : [...selected, option.id] : [option.id])} /><span>{option.label}</span></label>)}</div>{attempt && answer && <div className={`guided-feedback ${correct ? 'correct' : 'incorrect'}`}><p>{answer.explanation}</p>{question.options.map(option => <p key={option.id}><b>{option.label}:</b> {answer.optionFeedback[option.id]}</p>)}</div>}</section>
}
