import { useState } from 'react'
import { ArrowLeft, BookOpen, RotateCcw } from 'lucide-react'
import type { Progress, StatefulDraft, Ticket } from '../types'
import { commandLibrary } from './commands'
import { CommandQuickLookup } from './CommandLibrary'
import { applySimulatedAction, canDocument, emptyStatefulDraft, runStatefulFixture, verificationReady } from './stateful'
import type { GuidedCase } from './types'

type Props = { ticket: Ticket; guidedCase: GuidedCase; progress: Progress; setProgress: React.Dispatch<React.SetStateAction<Progress>>; onBack: () => void; onOpenLibrary: (id?: string) => void; onOpenExam: () => void }
const contextLabel = { guest: 'Guest VPS', client: 'Client', panel: 'Panel', hypervisor: 'Hypervisor' }
const errorLabel = { knowledge: 'Sai kiến thức', missing_evidence: 'Thiếu bằng chứng', unsafe_action: 'Hành động không an toàn' }

export function StatefulWorkspace({ ticket, guidedCase, progress, setProgress, onBack, onOpenLibrary, onOpenExam }: Props) {
  const draft = progress.statefulDrafts[ticket.id] ?? emptyStatefulDraft()
  const [input, setInput] = useState('')
  const [notice, setNotice] = useState('')
  const probes = guidedCase.probes.filter(probe => (probe.requiredState ?? ['initial']).includes(draft.state))
  const initialEvidence = ['P1', 'P2'].every(id => draft.commands.some(entry => entry.supported && entry.probeId === id && entry.state === 'initial'))
  const action = guidedCase.simulation?.transitions.find(item => item.actionId === draft.actionId)
  function update(patch: Partial<StatefulDraft> | ((previous: StatefulDraft) => Partial<StatefulDraft>)) {
    setProgress(current => { const previous = current.statefulDrafts[ticket.id] ?? emptyStatefulDraft(); return { ...current, statefulDrafts: { ...current.statefulDrafts, [ticket.id]: { ...previous, ...(typeof patch === 'function' ? patch(previous) : patch) } } } })
  }
  function run(command: string) {
    if (!command.trim() || draft.completed) return
    const { entry } = runStatefulFixture(command, guidedCase, commandLibrary, draft)
    update(current => ({ commands: [...current.commands, entry] }))
    setInput('')
    setNotice(entry.supported ? `${entry.probeId}: đã nạp output fixture ở trạng thái ${draft.state}.` : entry.output)
  }
  function choose(actionId: string) {
    if (draft.completed) return
    const result = applySimulatedAction(guidedCase, draft, actionId, draft.approval)
    update(result.draft)
    setNotice(result.message)
  }
  function complete() {
    if (draft.completed || !canDocument(guidedCase, draft)) return
    const now = new Date().toISOString()
    setProgress(current => {
      const previous = current.statefulDrafts[ticket.id] ?? emptyStatefulDraft()
      if (previous.completed || !canDocument(guidedCase, previous)) return current
      return { ...current, statefulDrafts: { ...current.statefulDrafts, [ticket.id]: { ...previous, completed: true } }, statefulAttempts: [{ id: crypto.randomUUID(), ticketId: ticket.id, createdAt: now, state: previous.state, commands: previous.commands, actionId: previous.actionId, note: previous.note, errors: previous.errors }, ...current.statefulAttempts] }
    })
    setNotice('Đã lưu lượt xử lý mô phỏng. Ghi chú của bạn không được tự động chấm từ keyword.')
  }
  function restart() {
    if (!window.confirm('Bắt đầu lượt Stateful mới? Lượt đã hoàn thành vẫn ở lịch sử.')) return
    update(emptyStatefulDraft()); setNotice(''); setInput('')
  }
  return <section className="stateful-page">
    <div className="page-heading"><div><button className="guided-back" onClick={onBack}><ArrowLeft size={15} /> Về ticket</button><h1>Stateful · {ticket.id}</h1><p>Điều tra → quyết định → hành động mô phỏng → kiểm tra trạng thái mới → ghi ticket.</p></div><div className="progress-summary">{draft.completed ? 'Completed' : draft.state === 'initial' ? 'Đang điều tra' : action?.safety === 'escalate' ? 'Đã chuyển cấp · cần xác minh' : 'Đã thay đổi · cần xác minh'}</div></div>
    <div className="guided-layout"><div className="guided-main">
      <section className="guided-card guided-ticket"><span className="guided-kicker">LỜI KHÁCH HÀNG</span><p>{ticket.customer_message}</p><p><b>Môi trường:</b> {ticket.guest_os} · {ticket.environment}</p></section>
      <section className="guided-card"><h2>1. Điều tra và đọc output</h2><p>Chọn phép kiểm tra tại đúng nơi chạy. Chỉ command có fixture mới trả output; lệnh khác không bị tính là sai kiến thức. Không có lệnh nào chạy thật.</p><div className="guided-probe-grid">{probes.map(probe => { const doc = commandLibrary.find(item => item.id === probe.commandId); return <div className="guided-probe" key={probe.id}><div><code>{probe.command}</code><button title="Giải thích command" onClick={() => onOpenLibrary(probe.commandId)}>ⓘ</button></div><small>{contextLabel[probe.context]} · {doc?.safety === 'privileged_read' ? 'Đọc cần quyền' : doc?.safety === 'change' ? 'Thay đổi' : 'Chỉ đọc'}</small><p>{probe.purpose}</p>{doc && <p><b>{probe.context === 'guest' ? ticket.guest_os.startsWith('Ubuntu') ? 'Ubuntu' : 'CentOS Stream 9' : contextLabel[probe.context]}:</b> {probe.context === 'guest' ? ticket.guest_os.startsWith('Ubuntu') ? doc.ubuntu : doc.centos : probe.command}</p>}<button disabled={draft.completed} onClick={() => run(probe.command)}>Nạp fixture</button></div> })}</div><form className="guided-command" onSubmit={event => { event.preventDefault(); run(input) }}><input aria-label="Command mô phỏng Stateful" value={input} onChange={event => setInput(event.target.value)} placeholder="Nhập command/tác vụ đúng fixture..." spellCheck={false} /><button disabled={!input.trim() || draft.completed}>Kiểm tra</button></form><CommandQuickLookup /><div className="guided-output">{draft.commands.length ? draft.commands.map(entry => { const probe = guidedCase.probes.find(item => item.id === entry.probeId); return <div key={entry.id}><code>{entry.state} · {probe ? contextLabel[probe.context] : 'Chưa hỗ trợ'} · {entry.command}</code><pre>{entry.output}</pre>{probe && <p><b>Cách đọc:</b> {probe.meaning} <button className="text-button" onClick={() => onOpenLibrary(probe.commandId)}>Thẻ command</button></p>}</div> }) : <p>Chưa có bằng chứng. Bắt đầu bằng phép đọc phù hợp với triệu chứng.</p>}</div></section>
      <section className="guided-card"><h2>2. Quyết định và hành động</h2>{!initialEvidence ? <p>Đọc P1 và P2 trước khi thấy các lựa chọn xử lý. Root cause chưa được công bố.</p> : draft.state === 'initial' ? <><p>Chọn hướng xử lý dựa trên output. Engine sẽ kiểm tra thêm bằng chứng và quyền; chọn sai không đổi trạng thái.</p><label className="stateful-approval"><input type="checkbox" checked={draft.approval} onChange={event => update({ approval: event.target.checked })} /> Tôi đã xác nhận quyền thay đổi, kế hoạch rollback và phạm vi ảnh hưởng trong tình huống mô phỏng.</label><div className="stateful-actions">{guidedCase.simulation?.transitions.filter(item => item.from === 'initial').map(item => <div className="stateful-action-option" key={item.actionId}><button onClick={() => choose(item.actionId)}><b>{item.label}</b><span>{contextLabel[item.context]} · {item.safety === 'escalate' ? 'Chuyển cấp' : 'Thay đổi hệ thống'}</span></button>{item.commandId && <button className="text-button" onClick={() => onOpenLibrary(item.commandId)}>Xem cú pháp, OS và rủi ro</button>}</div>)}</div></> : <div className="guided-result"><b>{action?.safety === 'escalate' ? 'Escalation đã ghi nhận' : 'Trạng thái đã thay đổi trong mô phỏng'}</b><pre>{draft.actionOutput}</pre><p>{draft.actionFeedback}</p><p>Chưa được coi là giải quyết cho đến khi có output xác minh; kết quả có thể chỉ là phục hồi một phần.</p></div>}{draft.errors.length > 0 && <div className="guided-mistakes"><b>Phản hồi học tập</b>{draft.errors.map((item, index) => <p key={index}><strong>{errorLabel[item.category]}:</strong> {item.detail}</p>)}</div>}</section>
      {draft.state !== 'initial' && <section className="guided-card"><h2>3. Xác minh và ghi ticket</h2><p>{verificationReady(guidedCase, draft) ? 'Đã chạy đủ probe xác minh sau hành động. Đọc kết quả để kết luận mức độ phục hồi.' : `Cần chạy các probe trạng thái mới: ${guidedCase.simulation?.verificationProbeIds.join(', ')}.`}</p><p>{guidedCase.verificationPrompt} Ghi rõ việc nào đã được xác minh, việc nào còn lỗi hoặc đang chờ escalation.</p><textarea aria-label="Ghi chú Stateful" rows={5} value={draft.note} disabled={draft.completed} onChange={event => update({ note: event.target.value })} placeholder="Triệu chứng; bằng chứng ban đầu; hành động có phép; output sau hành động; tình trạng còn lại..." /><div className="guided-footer"><button className="primary-button" onClick={complete} disabled={draft.completed || !canDocument(guidedCase, draft)}>{draft.completed ? 'Đã lưu' : 'Lưu ticket note'}</button>{draft.completed && <button className="guided-secondary" onClick={onOpenExam}>Làm Objective Exam</button>}</div></section>}
      {notice && <div className="notice" role="status">{notice}</div>}
    </div><aside className="guided-side"><div className="guided-card"><h3>Tiến độ</h3><p>{draft.commands.filter(entry => entry.supported && entry.state === 'initial').length} phép kiểm tra ban đầu</p><p>{guidedCase.simulation?.verificationProbeIds.filter(id => draft.commands.some(entry => entry.probeId === id && entry.state === draft.state)).length ?? 0}/{guidedCase.simulation?.verificationProbeIds.length ?? 0} phép xác minh sau xử lý</p><p>{draft.completed ? 'Completed · ghi chú đã lưu' : 'Tự động lưu trên trình duyệt'}</p><button className="guided-secondary" onClick={restart}><RotateCcw size={14} /> Lượt mới</button></div><button className="guided-library-link" onClick={() => onOpenLibrary()}><BookOpen size={15} /> Tra Command Library</button></aside></div>
  </section>
}

