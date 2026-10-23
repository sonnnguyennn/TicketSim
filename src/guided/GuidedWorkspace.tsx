import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, CircleHelp, Lightbulb, RotateCcw, Search, Terminal } from 'lucide-react'
import { answerUrl, isAnswer } from '../lib'
import type { Answer, CommandEntry, GuidedDraft, Progress, Ticket } from '../types'
import { classifyGuidedCommand, emptyGuidedDraft, gradeSelection, objectiveScore, stageComplete, STAGES } from './engine'
import { commandLibrary } from './commands'
import { CommandQuickLookup } from './CommandLibrary'
import { mistakeIds } from './review'
import { SupportLevelSelector } from '../SupportLevelSelector'
import type { SupportLevel } from '../types'
import type { GuidedAnswerKey, GuidedCase, GuidedQuestion } from './types'

type Props = { ticket: Ticket; guidedCase: GuidedCase; progress: Progress; setProgress: React.Dispatch<React.SetStateAction<Progress>>; supportLevel: SupportLevel; onSupportLevelChange: (value: SupportLevel) => void; onBack: () => void; onOpenLibrary: (id?: string) => void }

const contextLabel = (context: GuidedCase['probes'][number]['context']) => ({ guest: 'Guest', client: 'Client', panel: 'Panel', hypervisor: 'Hypervisor' })[context]

export function GuidedWorkspace({ ticket, guidedCase, progress, setProgress, supportLevel, onSupportLevelChange, onBack, onOpenLibrary }: Props) {
  const draft = progress.guidedDrafts[ticket.id] ?? emptyGuidedDraft()
  const [input, setInput] = useState('')
  const [hints, setHints] = useState<string[] | null>(null)
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [error, setError] = useState('')
  const stage = STAGES[draft.stage]
  const questions = guidedCase.questions.filter(question => question.stage === stage.id && question.kind !== 'short_answer')
  const savedAttempt = draft.submitted ? progress.guidedAttempts.find(attempt => attempt.ticketId === ticket.id) : undefined
  const score = savedAttempt ? { score: savedAttempt.score, total: savedAttempt.total } : objectiveScore(guidedCase, draft)
  const hintReady = draft.hintLevel === 0 || (draft.hintLevel === 1 ? draft.commands.some(entry => entry.supported) : ['P1', 'P2'].every(id => draft.commands.some(entry => entry.supported && entry.probeId === id)))

  useEffect(() => {
    setInput(''); setHints(null); setAnswer(null); setError('')
  }, [ticket.id])
  useEffect(() => {
    if (!draft.hintLevel || hints) return
    let active = true
    fetch(`${import.meta.env.BASE_URL}guided-hints/${ticket.id}.json`).then(response => response.json()).then((value: unknown) => {
      if (active && value && typeof value === 'object' && 'hints' in value && Array.isArray(value.hints) && value.hints.length === 3 && value.hints.every(item => typeof item === 'string')) setHints(value.hints as string[])
    }).catch(() => { if (active) setError('Không tải lại được gợi ý đã mở.') })
    return () => { active = false }
  }, [draft.hintLevel, hints, ticket.id])
  useEffect(() => {
    if (!draft.submitted) return
    let active = true
    fetch(answerUrl(ticket.id)).then(response => response.json()).then((value: unknown) => { if (active && isAnswer(value)) setAnswer(value) }).catch(() => { if (active) setError('Không tải được đáp án mẫu.') })
    return () => { active = false }
  }, [draft.submitted, ticket.id])

  function update(patch: Partial<GuidedDraft> | ((current: GuidedDraft) => Partial<GuidedDraft>)) {
    setProgress(current => {
      const previous = current.guidedDrafts[ticket.id] ?? emptyGuidedDraft()
      const changes = typeof patch === 'function' ? patch(previous) : patch
      return { ...current, guidedDrafts: { ...current.guidedDrafts, [ticket.id]: { ...previous, ...changes } } }
    })
  }
  function runCommand(command: string) {
    const result = classifyGuidedCommand(command, guidedCase.probes, commandLibrary)
    if (!command.trim()) return
    const entry: CommandEntry = {
      id: crypto.randomUUID(), command: command.trim(), at: new Date().toISOString(), kind: result.kind === 'available' && ['panel', 'hypervisor'].includes(result.probe.context) ? 'investigation' : 'terminal',
      supported: result.kind === 'available',
      probeId: result.kind === 'available' ? result.probe.id : undefined,
      output: result.kind === 'available' ? result.probe.output : result.message,
    }
    update(current => ({ commands: [...current.commands, entry] }))
    setInput('')
  }
  async function checkQuestion(question: GuidedQuestion) {
    const selected = draft.responses[question.id] ?? (question.kind === 'step_order' ? question.options.map(option => option.id).reverse() : [])
    if (!selected.length || draft.feedback[question.id]) return
    setError('')
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}guided-feedback/${ticket.id}/${question.id}.json`)
      if (!response.ok) throw new Error('Không tải được feedback')
      const key = await response.json() as GuidedAnswerKey
      if (!Array.isArray(key.correctIds) || typeof key.explanation !== 'string' || !key.optionFeedback || key.correctIds.some(id => !question.options.some(option => option.id === id))) throw new Error('Feedback không hợp lệ')
      update(current => ({ responses: { ...current.responses, [question.id]: selected }, feedback: { ...current.feedback, [question.id]: { correct: gradeSelection(selected, key, question.kind === 'step_order' ? 'step_order' : 'selection'), correctIds: key.correctIds, explanation: key.explanation, optionFeedback: key.optionFeedback, commandId: key.commandId } } }))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không tải được feedback') }
  }
  async function revealHint() {
    if (supportLevel === 'independent' || draft.hintLevel >= 3 || !hintReady) return
    try {
      let available = hints
      if (!available) {
        const response = await fetch(`${import.meta.env.BASE_URL}guided-hints/${ticket.id}.json`)
        if (!response.ok) throw new Error('Không tải được gợi ý')
        const value: unknown = await response.json()
        if (!value || typeof value !== 'object' || !('hints' in value) || !Array.isArray(value.hints) || value.hints.length !== 3 || value.hints.some(item => typeof item !== 'string')) throw new Error('Gợi ý không hợp lệ')
        available = value.hints as string[]
        setHints(available)
      }
      update({ hintLevel: draft.hintLevel + 1 })
      setError('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không tải được gợi ý') }
  }
  function submit() {
    if (draft.submitted || !stageComplete(guidedCase, 'verify', draft)) return
    setProgress(current => {
      const previous = current.guidedDrafts[ticket.id] ?? emptyGuidedDraft()
      if (previous.submitted) return current
      const { score, total } = objectiveScore(guidedCase, previous)
      const outcomes = Object.fromEntries(guidedCase.questions.filter(question => question.kind !== 'short_answer').map(question => [question.id, previous.feedback[question.id]?.correct === true]))
      return {
        ...current,
        guidedDrafts: { ...current.guidedDrafts, [ticket.id]: { ...previous, submitted: true } },
        guidedAttempts: [{ id: crypto.randomUUID(), ticketId: ticket.id, createdAt: new Date().toISOString(), responses: previous.responses, commands: previous.commands, hintLevel: previous.hintLevel, note: previous.note, score, total, independent: false, outcomes }, ...current.guidedAttempts],
      }
    })
  }
  function restart() {
    if (!window.confirm('Bắt đầu lại bài Guided? Lượt làm đã nộp vẫn nằm trong lịch sử.')) return
    update(emptyGuidedDraft())
    setAnswer(null); setHints(null); setInput('')
  }

  return <div className="guided-page">
    <div className="guided-topline"><button className="guided-back" onClick={onBack}><ArrowLeft size={16} /> Kho ticket</button><span>Bài học có hướng dẫn · {ticket.id}</span></div>
    <div className="guided-heading"><div><h1>{ticket.customer_message.split(/\n\s*\n/)[1] ?? ticket.id}</h1><p><strong>Mục tiêu:</strong> {guidedCase.objective}</p></div><button className="guided-secondary" onClick={() => onOpenLibrary()}><BookOpen size={16} /> Thư viện lệnh</button></div>
    <SupportLevelSelector value={supportLevel} onChange={onSupportLevelChange} />
    <nav className="guided-steps" aria-label="Các bước bài học">{STAGES.map((item, index) => <button key={item.id} className={index === draft.stage ? 'current' : index < draft.stage ? 'done' : ''} onClick={() => { if (index <= draft.stage) update({ stage: index }) }} disabled={index > draft.stage}><span>{index < draft.stage ? <Check size={13} /> : index + 1}</span>{item.label}</button>)}</nav>
    <div className="guided-layout">
      <div className="guided-main">
        <section className="guided-card guided-ticket"><span className="guided-kicker">LỜI KHÁCH HÀNG</span><p>{ticket.customer_message}</p>{guidedCase.customerFollowup && <p className="customer-followup">{guidedCase.customerFollowup}</p>}</section>
        {stage.id === 'investigate' && <section className="guided-card"><h2>Chọn phép kiểm tra</h2><p className="guided-muted">Chọn hoặc nhập lệnh để đọc bằng chứng. Mọi output chỉ lấy từ fixture của bài này.</p>{supportLevel !== 'independent' && <div className="guided-probe-grid">{guidedCase.probes.filter(probe => !probe.requiredState || probe.requiredState.includes('initial')).map(probe => <div className="guided-probe" key={probe.id}><div><code>{probe.command}</code><button title="Mở thẻ command" onClick={() => onOpenLibrary(probe.commandId)}><CircleHelp size={16} /></button></div><small>{contextLabel(probe.context)}</small>{supportLevel === 'beginner' && draft.commands.some(entry => entry.supported && entry.probeId === probe.id) && <p>{probe.purpose}</p>}<button onClick={() => runCommand(probe.command)}>Chạy mô phỏng <ArrowRight size={14} /></button></div>)}</div>}<form className="guided-command" onSubmit={event => { event.preventDefault(); runCommand(input) }}><Terminal size={17} /><input aria-label="Nhập command Guided" placeholder="Nhập command mô phỏng..." value={input} onChange={event => setInput(event.target.value)} list={supportLevel === 'independent' ? undefined : 'guided-command-options'} />{supportLevel !== 'independent' && <datalist id="guided-command-options">{guidedCase.probes.filter(probe => !probe.requiredState || probe.requiredState.includes('initial')).map(probe => <option key={probe.id} value={probe.command} />)}</datalist>}<button disabled={!input.trim()}>Kiểm tra</button></form><CommandQuickLookup /><div className="guided-output">{draft.commands.length ? draft.commands.map(entry => { const probe = guidedCase.probes.find(item => item.id === entry.probeId); return <div key={entry.id}><code>{entry.kind === 'investigation' && probe ? contextLabel(probe.context) : '$'} {entry.command}</code><pre>{entry.output}</pre>{probe && supportLevel !== 'independent' && <p><strong>{contextLabel(probe.context)} · Hiểu output:</strong> {probe.meaning}</p>}</div> }) : <p>Chưa chạy phép kiểm tra nào.</p>}</div></section>}
        {(stage.id === 'interpret' || stage.id === 'decide') && <section className="guided-card"><h2>Bằng chứng đã thu thập</h2>{draft.commands.filter(entry => entry.supported).length ? draft.commands.filter(entry => entry.supported).map(entry => <div className="guided-evidence" key={entry.id}><code>{entry.probeId} · {entry.command}</code><pre>{entry.output}</pre></div>) : <p className="guided-muted">Chưa có output. Quay lại bước Kiểm tra để thu thập bằng chứng.</p>}</section>}
        {questions.map(question => <QuestionCard key={question.id} question={question} draft={draft} onSelect={selected => update(current => ({ responses: { ...current.responses, [question.id]: selected } }))} onCheck={() => checkQuestion(question)} onOpenLibrary={onOpenLibrary} />)}
        {stage.id === 'verify' && <section className="guided-card"><h2>Short answer · Ghi ticket ngắn</h2><p className="guided-muted">{guidedCase.verificationPrompt}</p><textarea aria-label="Ghi chú cuối ticket" rows={5} value={draft.note} onChange={event => update({ note: event.target.value })} placeholder="Hiện tượng...\nBằng chứng...\nBước tiếp theo và xác minh..." disabled={draft.submitted} />{!draft.submitted && draft.note.trim().length > 0 && draft.note.replace(/\s/g, '').length < 30 && <p className="guided-muted">Ghi ít nhất 30 ký tự không tính khoảng trắng để mô tả phát hiện và bước tiếp theo.</p>}{draft.submitted && <div className="guided-result"><h3>Completed · {score.score}/{score.total} câu khách quan</h3><p>Mastered cần một lượt ôn độc lập sau ít nhất 24 giờ. Ghi chú trên do bạn tự đối chiếu; ứng dụng không tự chấm câu viết.</p>{mistakeIds(progress, guidedCase).length > 0 && <div className="guided-mistakes"><strong>Cần ôn lại</strong><ul>{guidedCase.questions.filter(question => mistakeIds(progress, guidedCase).includes(question.id)).map(question => <li key={question.id}>{question.prompt}</li>)}</ul></div>}{answer && <div className="guided-model"><strong>Đáp án mẫu</strong><p>{answer.expected_diagnosis}</p><p><b>Kiểm tra tiếp:</b> {answer.recommended_next_checks}</p><p><b>Hướng xử lý:</b> {answer.resolution_guidance}</p><p><b>Xác minh:</b> {answer.verification}</p><p><b>Escalation:</b> {answer.escalate_when}</p></div>}</div>}</section>}
        {stage.id === 'investigate' && !stageComplete(guidedCase, stage.id, draft) && <p className="guided-step-note">Trả lời câu hỏi chọn command và chạy đủ các probe được yêu cầu (P1, P2 và G nếu bài có) trước khi đọc bằng chứng.</p>}
        {error && <div className="notice error" role="alert">{error}</div>}
        <div className="guided-footer"><button className="guided-secondary" onClick={() => update({ stage: Math.max(0, draft.stage - 1) })} disabled={draft.stage === 0}><ArrowLeft size={15} /> Quay lại</button>{stage.id === 'verify' ? <button className="primary-button" onClick={submit} disabled={draft.submitted || !stageComplete(guidedCase, 'verify', draft)}>{draft.submitted ? 'Đã lưu lượt làm' : 'Nộp bài và xem đáp án'}</button> : <button className="primary-button" onClick={() => update({ stage: Math.min(4, draft.stage + 1) })} disabled={!stageComplete(guidedCase, stage.id, draft)}>Tiếp tục <ArrowRight size={15} /></button>}</div>
      </div>
      <aside className="guided-side">{supportLevel !== 'independent' && <div className="guided-card"><h3>Trợ giúp</h3><p>Cố gắng chọn bước kiểm tra và giải thích trước khi mở gợi ý.</p><button className="guided-secondary" onClick={revealHint} disabled={draft.hintLevel >= 3 || !hintReady}><Lightbulb size={15} /> {draft.hintLevel ? 'Gợi ý tiếp theo' : 'Cần gợi ý?'}</button>{!hintReady && <p>Gợi ý tiếp theo mở sau khi thu thập bằng chứng.</p>}{draft.hintLevel > 0 && hints && <ol>{hints.slice(0, draft.hintLevel).map(hint => <li key={hint}>{hint}</li>)}</ol>}</div>}<div className="guided-card"><h3>Tiến độ</h3><p>{Object.keys(draft.feedback).length}/{score.total} câu đã đối chiếu</p><p>{draft.commands.filter(entry => entry.supported).length} phép kiểm tra có output</p><p>{draft.hintLevel} gợi ý đã mở</p>{(draft.stage > 0 || draft.commands.length > 0 || Object.keys(draft.responses).length > 0 || draft.hintLevel > 0 || draft.note) && <button className="guided-secondary" onClick={restart}><RotateCcw size={15} /> Làm lại bài này</button>}</div><button className="guided-library-link" onClick={() => onOpenLibrary()}><Search size={15} /> Tra command và ý nghĩa</button></aside>
    </div>
  </div>
}

function QuestionCard({ question, draft, onSelect, onCheck, onOpenLibrary }: { question: GuidedQuestion; draft: GuidedDraft; onSelect: (ids: string[]) => void; onCheck: () => void; onOpenLibrary: (id?: string) => void }) {
  const selected = draft.responses[question.id] ?? (question.kind === 'step_order' ? question.options.map(option => option.id).reverse() : [])
  const feedback = draft.feedback[question.id]
  const missingProbe = question.requiredProbeIds?.some(id => !draft.commands.some(entry => entry.supported && entry.probeId === id))
  const multiple = question.kind === 'multi_select'
  const move = (index: number, direction: -1 | 1) => { const next = [...selected]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; onSelect(next) }
  return <section className="guided-card guided-question"><div className="guided-question-top"><span>{question.kind === 'step_order' ? 'SẮP XẾP BƯỚC' : question.kind === 'command_choice' ? 'CHỌN COMMAND' : multiple ? 'CHỌN NHIỀU' : question.kind === 'output_interpretation' ? 'ĐỌC OUTPUT' : 'CHỌN MỘT'}</span>{feedback && <strong className={feedback.correct ? 'correct' : 'incorrect'}>{feedback.correct ? 'Đúng' : 'Cần xem lại'}</strong>}</div><h2>{question.prompt}</h2>{missingProbe ? <p className="guided-muted">Hãy chạy probe liên quan ở bước Kiểm tra trước khi trả lời câu này.</p> : <>{question.kind === 'step_order' ? <ol className="guided-order">{selected.map((id, index) => <li key={id}><span>{question.options.find(option => option.id === id)?.label}</span><div><button aria-label={`Đưa bước ${index + 1} lên`} disabled={!!feedback || index === 0} onClick={() => move(index, -1)}>↑</button><button aria-label={`Đưa bước ${index + 1} xuống`} disabled={!!feedback || index === selected.length - 1} onClick={() => move(index, 1)}>↓</button></div></li>)}</ol> : <div className="guided-options">{question.options.map(option => <label key={option.id} className={selected.includes(option.id) ? 'selected' : ''}><input type={multiple ? 'checkbox' : 'radio'} name={question.id} checked={selected.includes(option.id)} disabled={!!feedback} onChange={() => onSelect(multiple ? selected.includes(option.id) ? selected.filter(id => id !== option.id) : [...selected, option.id] : [option.id])} /><span>{option.label}</span></label>)}</div>}{!feedback ? <button className="guided-secondary" onClick={onCheck} disabled={!selected.length}>Kiểm tra câu trả lời</button> : <div className={`guided-feedback ${feedback.correct ? 'correct' : 'incorrect'}`}><p>{feedback.explanation}</p>{question.kind === 'step_order' && <p><b>Thứ tự đúng:</b> {feedback.correctIds.map(id => question.options.find(option => option.id === id)?.label).join(' → ')}</p>}{question.options.map(option => <p key={option.id}><b>{option.label}:</b> {feedback.optionFeedback[option.id]}</p>)}{feedback.commandId && <button onClick={() => onOpenLibrary(feedback.commandId)}>Xem thẻ command liên quan <ArrowRight size={14} /></button>}</div>}</>}</section>
}

