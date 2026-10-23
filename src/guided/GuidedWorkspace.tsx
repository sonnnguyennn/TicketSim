import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, Lightbulb, RotateCcw, Terminal } from 'lucide-react'
import { isAnswer } from '../lib'
import type { Answer, CommandEntry, GuidedDraft, Progress, Ticket } from '../types'
import { classifyGuidedCommand, emptyGuidedDraft, gradeSelection, objectiveScore, stageComplete, STAGES } from './engine'
import { commandLibrary } from './commands'
import { CommandQuickLookup } from './CommandLibrary'
import { mistakeIds } from './review'
import type { GuidedAnswerKey, GuidedCase, GuidedQuestion } from './types'

type Props = { ticket: Ticket; guidedCase: GuidedCase; progress: Progress; setProgress: React.Dispatch<React.SetStateAction<Progress>>; onBack: () => void; onOpenLibrary: (id?: string) => void }

const contextLabel = (context: GuidedCase['probes'][number]['context']) => ({ guest: 'Guest', client: 'Client', panel: 'Panel', hypervisor: 'Hypervisor' })[context]

export function GuidedWorkspace({ ticket, guidedCase, progress, setProgress, onBack, onOpenLibrary }: Props) {
  const draft = progress.guidedDrafts[ticket.id] ?? emptyGuidedDraft()
  const input = draft.commandInput ?? ''
  const setInput = (commandInput: string) => update({ commandInput })
  const [hints, setHints] = useState<string[] | null>(null)
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [error, setError] = useState('')
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const draftGeneration = useRef(0)
  const stage = STAGES[draft.stage]
  const questions = guidedCase.questions.filter(question => question.stage === stage.id && question.kind !== 'short_answer')
  const savedAttempt = draft.submitted ? progress.guidedAttempts.find(attempt => attempt.ticketId === ticket.id) : undefined
  const score = savedAttempt ? { score: savedAttempt.score, total: savedAttempt.total } : objectiveScore(guidedCase, draft)
  const hintReady = draft.hintLevel === 0 || (draft.hintLevel === 1 ? draft.commands.some(entry => entry.supported) : ['P1', 'P2'].every(id => draft.commands.some(entry => entry.supported && entry.probeId === id)))
  const initialProbes = guidedCase.probes.filter(probe => !probe.requiredState || probe.requiredState.includes('initial'))
  const requiredProbeIds = new Set(guidedCase.questions.filter(question => question.stage === 'interpret').flatMap(question => question.requiredProbeIds ?? []))
  const remainingChecks = [...requiredProbeIds].filter(id => !draft.commands.some(entry => entry.supported && entry.probeId === id)).length
  const evidence = [...new Map(draft.commands.filter(entry => entry.supported).map(entry => [entry.probeId ?? entry.command, entry])).values()]

  useEffect(() => {
    draftGeneration.current += 1
    setHints(null); setAnswer(null); setError('')
    return () => { draftGeneration.current += 1 }
  }, [ticket.id])
  useEffect(() => {
    const terminal = terminalRef.current
    if (terminal) terminal.scrollTop = terminal.scrollHeight
  }, [draft.commands.length, stage.id])
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
    fetch(`${import.meta.env.BASE_URL}guided-answers/${ticket.id}.json`).then(response => response.json()).then((value: unknown) => { if (active && isAnswer(value)) setAnswer(value) }).catch(() => { if (active) setError('Không tải được đáp án mẫu.') })
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
    update(current => ({ commands: [...current.commands, entry], commandInput: '' }))
  }
  async function checkQuestion(question: GuidedQuestion) {
    const selected = draft.responses[question.id] ?? (question.kind === 'step_order' ? question.options.map(option => option.id).reverse() : [])
    if (!selected.length || draft.feedback[question.id]) return
    const generation = draftGeneration.current
    setError('')
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}guided-feedback/${ticket.id}/${question.id}.json`)
      if (!response.ok) throw new Error('Không tải được phần giải thích.')
      const key = await response.json() as GuidedAnswerKey
      if (generation !== draftGeneration.current) return
      if (!Array.isArray(key.correctIds) || typeof key.explanation !== 'string' || !key.optionFeedback || key.correctIds.some(id => !question.options.some(option => option.id === id))) throw new Error('Phần giải thích chưa hợp lệ.')
      update(current => ({ responses: { ...current.responses, [question.id]: selected }, feedback: { ...current.feedback, [question.id]: { correct: gradeSelection(selected, key, question.kind === 'step_order' ? 'step_order' : 'selection'), correctIds: key.correctIds, explanation: key.explanation, optionFeedback: key.optionFeedback, commandId: key.commandId } } }))
    } catch (cause) { if (generation === draftGeneration.current) setError(cause instanceof Error ? cause.message : 'Không tải được phần giải thích.') }
  }
  async function revealHint() {
    if (draft.hintLevel >= 3 || !hintReady) return
    const generation = draftGeneration.current
    try {
      let available = hints
      if (!available) {
        const response = await fetch(`${import.meta.env.BASE_URL}guided-hints/${ticket.id}.json`)
        if (!response.ok) throw new Error('Không tải được gợi ý')
        const value: unknown = await response.json()
        if (generation !== draftGeneration.current) return
        if (!value || typeof value !== 'object' || !('hints' in value) || !Array.isArray(value.hints) || value.hints.length !== 3 || value.hints.some(item => typeof item !== 'string')) throw new Error('Gợi ý không hợp lệ')
        available = value.hints as string[]
        setHints(available)
      }
      update({ hintLevel: draft.hintLevel + 1 })
      setError('')
    } catch (cause) { if (generation === draftGeneration.current) setError(cause instanceof Error ? cause.message : 'Không tải được gợi ý') }
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
    if (!window.confirm('Bắt đầu lại bài học? Lượt đã nộp vẫn được giữ trong lịch sử.')) return
    draftGeneration.current += 1
    update(emptyGuidedDraft())
    setAnswer(null); setHints(null)
  }

  return <div className="guided-page guided-focused">
    <div className="guided-topline"><button className="guided-back" onClick={onBack}><ArrowLeft size={16} /> Kho ticket</button><span>{ticket.id} · L{ticket.difficulty}</span></div>
    <header className="guided-heading"><div><h1>{ticket.topic_vi}</h1><p>{guidedCase.objective}</p></div><button className="guided-secondary" onClick={() => onOpenLibrary()}><BookOpen size={16} /> Thư viện lệnh</button></header>
    <nav className="guided-steps" aria-label="Các bước bài học">{STAGES.map((item, index) => <button key={item.id} className={index === draft.stage ? 'current' : index < draft.stage ? 'done' : ''} aria-current={index === draft.stage ? 'step' : undefined} onClick={() => { if (index <= draft.stage) update({ stage: index }) }} disabled={index > draft.stage}><span>{index < draft.stage ? <Check size={13} /> : index + 1}</span>{item.label}</button>)}</nav>
    <div className="guided-main">
      {stage.id === 'triage' ? <section className="guided-card guided-ticket"><h2>Lời khách hàng</h2>{guidedCase.customerExplanation && <p className="customer-explanation">{guidedCase.customerExplanation}</p>}<p>{ticket.customer_message}</p>{guidedCase.customerFollowup && <p className="customer-followup">{guidedCase.customerFollowup}</p>}</section> : <details className="guided-customer" key={stage.id}><summary>Xem lời khách hàng</summary>{guidedCase.customerExplanation && <p className="customer-explanation">{guidedCase.customerExplanation}</p>}<p>{ticket.customer_message}</p>{guidedCase.customerFollowup && <p>{guidedCase.customerFollowup}</p>}</details>}
      {(stage.id === 'interpret' || stage.id === 'decide') && <details className="guided-reference"><summary>Bằng chứng đã thu thập · {evidence.length} kết quả</summary>{evidence.map(entry => {
        const probe = guidedCase.probes.find(item => item.id === entry.probeId)
        return <details key={entry.id}><summary><span>{probe ? contextLabel(probe.context) : 'Đã kiểm tra'}</span> <code>{entry.command}</code></summary><pre>{entry.output}</pre>{entry.output === '' && <p>Không có output.</p>}{probe && <p>{probe.meaning}</p>}</details>
      })}</details>}
      {questions.map(question => <QuestionCard key={question.id} question={question} draft={draft} onSelect={selected => update(current => ({ responses: { ...current.responses, [question.id]: selected } }))} onCheck={() => checkQuestion(question)} onOpenLibrary={onOpenLibrary} />)}
      {stage.id === 'investigate' && <section className="guided-terminal" aria-label="Terminal mô phỏng">
        <div className="terminal-heading"><h2><Terminal size={18} /> Kiểm tra</h2><span>{initialProbes.filter(probe => draft.commands.some(entry => entry.supported && entry.probeId === probe.id)).length}/{initialProbes.length} đã xem</span></div>
        <details className="terminal-suggestions" open>
          <summary>Lệnh và tác vụ gợi ý</summary>
          <div>{initialProbes.map(probe => <button key={probe.id} type="button" aria-label={'Chọn ' + probe.command} onClick={() => { setInput(probe.command); inputRef.current?.focus() }}><span>{contextLabel(probe.context)}</span><code>{probe.command}</code>{draft.commands.some(entry => entry.supported && entry.probeId === probe.id) && <Check size={14} aria-label="Đã xem" />}</button>)}</div>
        </details>
        <div className="terminal-history" role="log" aria-label="Lịch sử kiểm tra" tabIndex={0} ref={terminalRef}>
          {draft.commands.length ? draft.commands.map(entry => {
            const probe = guidedCase.probes.find(item => item.id === entry.probeId)
            return <div className="terminal-entry" key={entry.id} data-probe-id={entry.probeId}>
              <div className="terminal-command"><span>{probe ? contextLabel(probe.context) : entry.kind === 'investigation' ? 'Tác vụ' : 'Lệnh đã nhập'}</span><code>{probe?.context !== 'panel' ? '$ ' : ''}{entry.command}</code></div>
              {entry.supported ? <><pre>{entry.output}</pre>{entry.output === '' && <p className="terminal-empty-output">Không có output. Chưa đủ để kết luận nguyên nhân.</p>}</> : <p className="terminal-message">{entry.output}</p>}
              {entry.supported && probe && <dl className="terminal-explanation"><div><dt>Kiểm tra gì?</dt><dd>{probe.purpose}</dd></div>{probe.why && <div><dt>Vì sao dùng?</dt><dd>{probe.why}</dd></div>}<div><dt>Cách đọc</dt><dd>{probe.meaning}</dd></div></dl>}
            </div>
          }) : <p className="terminal-empty">Chọn hoặc nhập lệnh để kiểm tra.</p>}
        </div>
        <form className="terminal-input" onSubmit={event => { event.preventDefault(); runCommand(input); inputRef.current?.focus() }}>
          <label className="sr-only" htmlFor="guided-command-input">Nhập lệnh hoặc tác vụ</label><span aria-hidden="true">›</span><input id="guided-command-input" ref={inputRef} placeholder="Nhập lệnh hoặc tác vụ..." value={input} onChange={event => setInput(event.target.value)} list="guided-command-options" autoComplete="off" autoCapitalize="off" spellCheck={false} /><datalist id="guided-command-options">{initialProbes.map(probe => <option key={probe.id} value={probe.command} />)}</datalist><button type="submit" disabled={!input.trim()}>Chạy kiểm tra</button>
        </form>
        <CommandQuickLookup />
      </section>}
      {stage.id === 'verify' && <section className="guided-card"><h2>Tổng kết ticket</h2><p className="guided-muted">{guidedCase.verificationPrompt}</p><textarea aria-label="Ghi chú cuối ticket" rows={5} value={draft.note} onChange={event => update({ note: event.target.value })} placeholder={'Hiện tượng...\nBằng chứng...\nBước tiếp theo và xác minh...'} disabled={draft.submitted} />{!draft.submitted && draft.note.trim().length > 0 && draft.note.replace(/\s/g, '').length < 30 && <p className="guided-muted">Viết ít nhất 30 ký tự không tính khoảng trắng.</p>}{draft.submitted && <div className="guided-result"><h3>Đã hoàn thành · {score.score}/{score.total} câu đúng</h3><p>Đối chiếu ghi chú của bạn với đáp án bên dưới.</p>{mistakeIds(progress, guidedCase).length > 0 && <details className="guided-mistakes"><summary>Câu cần xem lại</summary><ul>{guidedCase.questions.filter(question => mistakeIds(progress, guidedCase).includes(question.id)).map(question => <li key={question.id}>{question.prompt}</li>)}</ul></details>}{answer && <div className="guided-model"><strong>Đáp án tham khảo</strong><p>{answer.expected_diagnosis}</p><p><b>Kiểm tra tiếp:</b> {answer.recommended_next_checks}</p><p><b>Hướng xử lý:</b> {answer.resolution_guidance}</p><p><b>Xác minh:</b> {answer.verification}</p><p><b>Khi cần chuyển cấp:</b> {answer.escalate_when}</p></div>}</div>}</section>}
      <details className="guided-hints"><summary><Lightbulb size={15} /> Gợi ý{draft.hintLevel > 0 ? ' · ' + draft.hintLevel + '/3 đã mở' : ''}</summary><button className="guided-secondary" onClick={revealHint} disabled={draft.hintLevel >= 3 || !hintReady}>{draft.hintLevel >= 3 ? 'Đã mở hết gợi ý' : draft.hintLevel ? 'Mở gợi ý tiếp' : 'Mở gợi ý'}</button>{!hintReady && <p>Thu thập thêm bằng chứng để mở gợi ý tiếp.</p>}{draft.hintLevel > 0 && hints && <ol>{hints.slice(0, draft.hintLevel).map(hint => <li key={hint}>{hint}</li>)}</ol>}</details>
      {stage.id === 'investigate' && remainingChecks > 0 && <p className="guided-step-note">Còn {remainingChecks} phép kiểm tra bắt buộc trước khi đọc bằng chứng.</p>}
      {error && <div className="notice error" role="alert">{error}</div>}
      <div className="guided-footer"><button className="guided-secondary" onClick={() => update({ stage: Math.max(0, draft.stage - 1) })} disabled={draft.stage === 0}><ArrowLeft size={15} /> Quay lại</button>{stage.id === 'verify' ? draft.submitted ? <button className="primary-button" onClick={onBack}>Về kho ticket <ArrowRight size={15} /></button> : <button className="primary-button" onClick={submit} disabled={!stageComplete(guidedCase, 'verify', draft)}>Hoàn thành và xem đáp án</button> : <button className="primary-button" onClick={() => update({ stage: Math.min(4, draft.stage + 1) })} disabled={!stageComplete(guidedCase, stage.id, draft)}>Tiếp tục <ArrowRight size={15} /></button>}</div>
      {(draft.stage > 0 || draft.commands.length > 0 || Object.keys(draft.responses).length > 0 || draft.hintLevel > 0 || draft.note) && <details className="guided-options-menu"><summary>Tùy chọn bài học</summary><button className="guided-secondary" onClick={restart}><RotateCcw size={15} /> Làm lại bài này</button></details>}
    </div>
  </div>
}

function QuestionCard({ question, draft, onSelect, onCheck, onOpenLibrary }: { question: GuidedQuestion; draft: GuidedDraft; onSelect: (ids: string[]) => void; onCheck: () => void; onOpenLibrary: (id?: string) => void }) {
  const selected = draft.responses[question.id] ?? (question.kind === 'step_order' ? question.options.map(option => option.id).reverse() : [])
  const feedback = draft.feedback[question.id]
  const missingProbe = question.requiredProbeIds?.some(id => !draft.commands.some(entry => entry.supported && entry.probeId === id))
  const multiple = question.kind === 'multi_select'
  const move = (index: number, direction: -1 | 1) => { const next = [...selected]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; onSelect(next) }
  return <section className="guided-card guided-question"><div className="guided-question-top"><span>{question.kind === 'step_order' ? 'SẮP XẾP BƯỚC' : question.kind === 'command_choice' ? 'CHỌN LỆNH' : multiple ? 'CHỌN NHIỀU' : question.kind === 'output_interpretation' ? 'ĐỌC OUTPUT' : 'CHỌN MỘT'}</span>{feedback && <strong className={feedback.correct ? 'correct' : 'incorrect'}>{feedback.correct ? 'Đúng' : 'Cần xem lại'}</strong>}</div><h2>{question.prompt}</h2>
    {missingProbe ? <p className="guided-muted">Thu thập bằng chứng liên quan ở bước Kiểm tra trước khi trả lời.</p> : <>
      {question.kind === 'step_order' ? <ol className="guided-order">{selected.map((id, index) => <li key={id}><span>{question.options.find(option => option.id === id)?.label}</span><div><button aria-label={'Đưa bước ' + (index + 1) + ' lên'} disabled={!!feedback || index === 0} onClick={() => move(index, -1)}>↑</button><button aria-label={'Đưa bước ' + (index + 1) + ' xuống'} disabled={!!feedback || index === selected.length - 1} onClick={() => move(index, 1)}>↓</button></div></li>)}</ol> : <div className="guided-options">{question.options.map(option => <label key={option.id} className={selected.includes(option.id) ? 'selected' : ''}><input type={multiple ? 'checkbox' : 'radio'} name={question.id} checked={selected.includes(option.id)} disabled={!!feedback} onChange={() => onSelect(multiple ? selected.includes(option.id) ? selected.filter(id => id !== option.id) : [...selected, option.id] : [option.id])} /><span>{option.label}</span></label>)}</div>}
      {!feedback ? <button className="guided-secondary" onClick={onCheck} disabled={!selected.length}>Kiểm tra câu trả lời</button> : <div className={'guided-feedback ' + (feedback.correct ? 'correct' : 'incorrect')} role="status"><p>{feedback.explanation}</p><details><summary>Giải thích từng lựa chọn</summary>{question.kind === 'step_order' && <p><b>Thứ tự đúng:</b> {feedback.correctIds.map(id => question.options.find(option => option.id === id)?.label).join(' → ')}</p>}{question.options.map(option => <p key={option.id}><b>{option.label}:</b> {feedback.optionFeedback[option.id]}</p>)}</details>{feedback.commandId && <button onClick={() => onOpenLibrary(feedback.commandId)}>Tra lệnh liên quan <ArrowRight size={14} /></button>}</div>}
    </>}
  </section>
}
