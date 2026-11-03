import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, ArrowDownToLine, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, CircleHelp, Command, FileText, History, Lightbulb, RotateCcw, Search, Server, Settings2, ShieldCheck, Terminal, Upload } from 'lucide-react'
import publicTickets from './data/tickets-public.json'
import guidedPublic from './data/guided-public.json'
import { answerUrl, customerSummary, DEFAULT_RUBRIC, emptyDraft, emptyProgress, filterTickets, hintUrl, isAnswer, isInvestigation, matchProbeForKind, scoreChecks, SCORE_KEYS, SCORE_LABELS } from './lib'
import { clearProgress, loadProgress, migrateProgress, saveProgress } from './storage'
import { GuidedWorkspace } from './guided/GuidedWorkspace'
import { RealLabPage } from './real-lab/RealLabPage'
import { CommandLibrary, CommandQuickLookup } from './guided/CommandLibrary'
import { ReviewWorkspace } from './guided/ReviewWorkspace'
import { ExamWorkspace } from './ExamWorkspace'
import { StatefulWorkspace } from './guided/StatefulWorkspace'
import { ObjectiveExamWorkspace } from './guided/ObjectiveExamWorkspace'
import { Milestone5History } from './guided/Milestone5History'
import { classifyGuidedCommand } from './guided/engine'
import { commandLibrary } from './guided/commands'
import type { GuidedCase } from './guided/types'
import type { Answer, Attempt, CommandEntry, Draft, FormFields, Progress, Ticket } from './types'

const tickets = publicTickets as Ticket[]
const guidedCases = guidedPublic as GuidedCase[]
const guidedIds = new Set(guidedCases.map(item => item.id))
const topics = [...new Map(tickets.map(ticket => [ticket.topic, ticket.topic_vi])).entries()]
const fieldMeta: { key: keyof FormFields; label: string; placeholder: string; long?: boolean }[] = [
  { key: 'issue', label: 'Vấn đề chính', placeholder: 'Tóm tắt triệu chứng khách hàng báo...' },
  { key: 'hypothesis', label: 'Chẩn đoán / giả thuyết *', placeholder: 'Nguyên nhân có thể là gì? Mức độ chắc chắn của bạn?', long: true },
  { key: 'evidence', label: 'Bằng chứng', placeholder: 'Trích output đã kiểm tra, ví dụ: P1 cho thấy...', long: true },
  { key: 'nextCheck', label: 'Lệnh kiểm tra tiếp', placeholder: 'Lệnh hoặc dữ liệu bạn cần tiếp theo...' },
  { key: 'action', label: 'Hướng xử lý', placeholder: 'Đề xuất hành động an toàn, quyền hạn và rollback...', long: true },
  { key: 'verification', label: 'Xác minh sau xử lý', placeholder: 'Làm sao biết sự cố đã được giải quyết?' },
  { key: 'escalation', label: 'Escalation / cần hỗ trợ', placeholder: 'Khi nào chuyển lên L2, đội hạ tầng hoặc bộ phận khác?' },
]
const statusText = { new: 'Chưa làm', started: 'Đang làm', completed: 'Đã hoàn thành' }
const priorityText = (value: string) => value.startsWith('High') ? 'Ưu tiên cao' : value === 'Normal' ? 'Ưu tiên thường' : value
function guidedStatus(id: string, progress: Progress): 'new' | 'started' | 'completed' {
  if (progress.guidedAttempts.some(attempt => attempt.ticketId === id)) return 'completed'
  const draft = progress.guidedDrafts[id]
  return draft && (draft.stage > 0 || draft.commands.length > 0 || draft.hintLevel > 0 || draft.note.trim() || Object.keys(draft.responses).length > 0 || Object.keys(draft.feedback).length > 0) ? 'started' : 'new'
}

function App() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress())
  const supportLevel = progress.supportLevel ?? 'normal'
  const [selectedId, setSelectedId] = useState(() => { try { const remembered = localStorage.getItem('ticketsim-last-ticket'); return tickets.some(item => item.id === remembered) ? remembered! : tickets[0].id } catch { return tickets[0].id } })
  const [view, setView] = useState<'workspace' | 'practice' | 'guided' | 'stateful' | 'exam' | 'objective' | 'library' | 'review' | 'history' | 'advanced-history' | 'settings' | 'real-lab'>(() => location.hash.startsWith('#pair=') || location.hash === '#real-lab' ? 'real-lab' : 'workspace')
  const [libraryFocus, setLibraryFocus] = useState<string | undefined>()
  const [libraryOrigin, setLibraryOrigin] = useState<'guided' | 'exam' | 'stateful' | 'workspace' | 'practice'>('workspace')
  const [topic, setTopic] = useState('all')
  const [level, setLevel] = useState('all')
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')
  const [command, setCommand] = useState('')
  const [investigationInput, setInvestigationInput] = useState('')
  const [answerResult, setAnswerResult] = useState<{ ticketId: string; data: Answer } | null>(null)
  const [hintResult, setHintResult] = useState<{ ticketId: string; text: string } | null>(null)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState(false)
  const [notice, setNotice] = useState('')
  const [keepCurrentOpen, setKeepCurrentOpen] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)
  const terminalBodyRef = useRef<HTMLDivElement>(null)
  const caseRef = useRef<HTMLDivElement>(null)
  const ticketListRef = useRef<HTMLDivElement>(null)
  const activeTicketIdRef = useRef(selectedId)
  const lastFilterKeyRef = useRef(JSON.stringify(['all', 'all', 'all', '']))
  const ticket = tickets.find(item => item.id === selectedId) ?? tickets[0]
  const guidedCase = guidedCases.find(item => item.id === ticket.id)
  const answer = answerResult?.ticketId === ticket.id ? answerResult.data : null
  const hint = hintResult?.ticketId === ticket.id ? hintResult.text : null
  const draft = progress.drafts[ticket.id] ?? emptyDraft()
  const terminalProbes = ticket.probe_outputs.filter(probe => !isInvestigation(probe.command))
  const investigations = ticket.probe_outputs.filter(probe => isInvestigation(probe.command))
  const visibleTickets = useMemo(() => filterTickets(tickets, { topic, level, status: 'all', query }, progress).filter(item => status === 'all' || guidedStatus(item.id, progress) === status), [topic, level, status, query, progress])
  const completedIds = new Set(progress.guidedAttempts.map(attempt => attempt.ticketId))
  const startedCount = tickets.filter(item => guidedStatus(item.id, progress) === 'started').length
  const hasNotes = Object.values(draft.form).some(value => value.trim())
  const latestAttempt = progress.attempts.find(attempt => attempt.ticketId === ticket.id)
  const attemptSnapshot = (form: FormFields, commands: CommandEntry[], checks: Draft['checks'], hintViewed: boolean, roundId?: string) => JSON.stringify({ form, commands, checks, hintViewed, roundId })
  const alreadySaved = !!latestAttempt && attemptSnapshot(latestAttempt.form, latestAttempt.commands, latestAttempt.checks, latestAttempt.hintViewed, latestAttempt.roundId) === attemptSnapshot(draft.form, draft.commands, draft.checks, draft.hintViewed, draft.roundId)

  useEffect(() => { setSaveError(!saveProgress(progress)) }, [progress])
  useEffect(() => { try { localStorage.setItem('ticketsim-last-ticket', selectedId) } catch { /* Selection memory is optional. */ } }, [selectedId])
  useEffect(() => { activeTicketIdRef.current = selectedId; setAnswerResult(null); setHintResult(null); setLoadError(''); setCommand(''); setInvestigationInput(''); setNotice('') }, [selectedId])
  useEffect(() => { if (draft.commands.length) terminalBodyRef.current?.scrollTo({ top: terminalBodyRef.current.scrollHeight, behavior: 'smooth' }) }, [draft.commands.length, selectedId])
  useEffect(() => {
    if (view !== 'workspace' || !ticketListRef.current) return
    const list = ticketListRef.current
    const row = [...list.querySelectorAll<HTMLButtonElement>('[data-ticket-id]')].find(item => item.dataset.ticketId === selectedId)
    if (!row) return
    const listBounds = list.getBoundingClientRect()
    const rowBounds = row.getBoundingClientRect()
    if (rowBounds.top < listBounds.top || rowBounds.bottom > listBounds.bottom) list.scrollTop += rowBounds.top - listBounds.top - 4
  }, [selectedId, view, topic, level, status, query])
  useEffect(() => {
    if (view !== 'workspace' && view !== 'practice') return
    const filterKey = JSON.stringify([topic, level, status, query])
    if (lastFilterKeyRef.current === filterKey) return
    lastFilterKeyRef.current = filterKey
    if (visibleTickets.length && !visibleTickets.some(item => item.id === selectedId)) {
      activeTicketIdRef.current = visibleTickets[0].id
      setSelectedId(visibleTickets[0].id)
    }
  }, [visibleTickets, selectedId, topic, level, status, query, view])

  function updateDraft(changes: Partial<Draft> | ((currentDraft: Draft) => Partial<Draft>), id = ticket.id) {
    if (status !== 'all' && id === selectedId) setKeepCurrentOpen(true)
    setProgress(current => {
      const currentDraft = current.drafts[id] ?? emptyDraft()
      const patch = typeof changes === 'function' ? changes(currentDraft) : changes
      const nextDraft = { ...currentDraft, ...patch }
      const drafts = { ...current.drafts }
      if (!nextDraft.roundId && !nextDraft.hintViewed && !nextDraft.answerRevealed && !nextDraft.commands.length && Object.values(nextDraft.form).every(value => !value.trim()) && Object.values(nextDraft.checks).every(value => !value)) delete drafts[id]
      else drafts[id] = nextDraft
      return { ...current, drafts }
    })
  }
  function updateField(key: keyof FormFields, value: string) { updateDraft(current => ({ form: { ...current.form, [key]: value } })) }
  function selectTicket(id: string) {
    setKeepCurrentOpen(false)
    activeTicketIdRef.current = id
    setSelectedId(id)
    if (window.innerWidth <= 760) requestAnimationFrame(() => caseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  function openTicketFromHistory(id: string) {
    setKeepCurrentOpen(false)
    setTopic('all'); setLevel('all'); setStatus('all'); setQuery('')
    activeTicketIdRef.current = id
    setSelectedId(id); setView('practice')
  }
  function continueLearning() {
    if (guidedIds.has(selectedId)) setView('guided')
  }
  function runProbe(input: string, kind: 'terminal' | 'investigation' = 'terminal') {
    if (!input.trim()) return
    const probe = matchProbeForKind(ticket.probe_outputs, input, kind)
    const supported = !!probe
    const classification = kind === 'terminal' && !supported ? classifyGuidedCommand(input, [], commandLibrary) : null
    const entry: CommandEntry = {
      id: crypto.randomUUID(), probeId: supported ? probe?.probe_id : undefined, command: input.trim(),
      output: supported && probe ? probe.stdout : kind === 'investigation' ? 'Tác vụ này chưa có dữ liệu mô phỏng cho ticket này.' : classification && 'message' in classification ? classification.message : 'Chưa có dữ liệu mô phỏng.',
      supported, kind, at: new Date().toISOString(),
    }
    updateDraft(current => ({ commands: [...current.commands, entry] }))
    if (kind === 'investigation') setInvestigationInput('')
    else setCommand('')
  }
  function citeEvidence(entry: CommandEntry) {
    if (!entry.supported || !entry.probeId) return
    const citation = `${entry.probeId} (${entry.command}): ${entry.output}`
    updateDraft(current => ({ form: { ...current.form, evidence: current.form.evidence.includes(citation) ? current.form.evidence : [current.form.evidence.trim(), citation].filter(Boolean).join('\n') } }))
    setNotice(`Đã thêm ${entry.probeId} vào phần bằng chứng.`)
  }
  async function loadHint() {
    setLoadError('')
    const id = ticket.id
    try {
      const response = await fetch(hintUrl(id))
      if (!response.ok) throw new Error('Không tải được gợi ý')
      const data: unknown = await response.json()
      if (!data || typeof data !== 'object' || !('hint' in data) || typeof data.hint !== 'string') throw new Error('Dữ liệu gợi ý không hợp lệ')
      if (activeTicketIdRef.current !== id) return
      setHintResult({ ticketId: id, text: data.hint })
      updateDraft({ hintViewed: true }, id)
    } catch (error) { if (activeTicketIdRef.current === id) setLoadError(error instanceof Error ? error.message : 'Không tải được gợi ý') }
  }
  async function revealAnswer() {
    if (!draft.form.hypothesis.trim()) { setNotice('Hãy ghi chẩn đoán hoặc giả thuyết trước khi xem đáp án.'); return }
    if (!draft.answerRevealed && new Set(draft.commands.filter(entry => entry.supported).map(entry => entry.probeId)).size < ticket.probe_outputs.length) { setNotice('Hãy thu thập đủ hai output của ticket trước khi xem đáp án.'); return }
    setLoadError(''); setNotice('')
    const id = ticket.id
    try {
      const response = await fetch(answerUrl(id))
      if (!response.ok) throw new Error('Không tải được đáp án')
      const data: unknown = await response.json()
      if (!isAnswer(data)) throw new Error('Dữ liệu đáp án không hợp lệ')
      if (activeTicketIdRef.current !== id) return
      setAnswerResult({ ticketId: id, data })
      updateDraft({ answerRevealed: true }, id)
    } catch (error) { if (activeTicketIdRef.current === id) setLoadError(error instanceof Error ? error.message : 'Không tải được đáp án') }
  }
  function saveAttempt() {
    if (!answer || alreadySaved) return
    if (status !== 'all') setKeepCurrentOpen(true)
    const attempt: Attempt = {
      id: crypto.randomUUID(), ticketId: ticket.id, createdAt: new Date().toISOString(), roundId: draft.roundId,
      form: { ...draft.form }, commands: [...draft.commands], hintViewed: draft.hintViewed,
      selfScore: scoreChecks(draft.checks, answer.scoring_rubric ?? DEFAULT_RUBRIC), checks: { ...draft.checks },
    }
    setProgress(current => ({ ...current, attempts: [attempt, ...current.attempts] }))
    setNotice('Đã lưu lượt làm. Bạn có thể tiếp tục luyện ticket này hoặc chọn ticket khác.')
  }
  function restartTicket() {
    if (!window.confirm('Xóa ghi chú và các bước điều tra hiện tại để làm lại ticket? Lịch sử đã lưu vẫn được giữ.')) return
    updateDraft({ ...emptyDraft(), roundId: crypto.randomUUID() })
    setAnswerResult(null); setHintResult(null); setCommand(''); setInvestigationInput('')
    setNotice('Đã bắt đầu lượt làm mới. Lịch sử cũ vẫn còn.')
  }
  function exportProgress() {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = `vps-support-progress-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link); link.click(); link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  async function importProgress(file: File | undefined) {
    if (!file) return
    try {
      if (file.size > 4_000_000) throw new Error('File tiến độ quá lớn để lưu trong trình duyệt này.')
      const parsed: unknown = JSON.parse(await file.text())
      const imported = migrateProgress(parsed)
      if (!imported) throw new Error('File tiến độ không đúng định dạng phiên bản 1–5.')
      if ((progress.attempts.length || progress.guidedAttempts.length || progress.examAttempts.length || progress.statefulAttempts.length || progress.objectiveExamAttempts.length || Object.values(progress.statefulDrafts).length || Object.values(progress.objectiveExamDrafts).length || Object.values(progress.guidedDrafts).length || Object.values(progress.examDrafts).length || Object.values(progress.drafts).some(item => item.commands.length || item.hintViewed || item.answerRevealed || Object.values(item.form).some(Boolean))) && !window.confirm('Nhập file sẽ thay thế tiến độ hiện tại trên trình duyệt này. Tiếp tục?')) return
      if (!saveProgress(imported)) throw new Error('Không đủ dung lượng lưu trữ để nhập tiến độ.')
      setProgress(imported)
      setAnswerResult(null); setHintResult(null)
      setNotice('Đã nhập tiến độ thành công.')
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Không thể nhập file tiến độ.') }
    finally { if (importRef.current) importRef.current.value = '' }
  }
  function resetProgress() {
    if (!window.confirm('Xóa toàn bộ ghi chú, lịch sử làm bài và tiến độ trên trình duyệt này?')) return
    clearProgress(); setProgress(emptyProgress()); setAnswerResult(null); setHintResult(null); setNotice('Đã xóa tiến độ.')
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><Terminal size={21} strokeWidth={2.3} /></div><div><strong>VPS Support</strong><span>Ticket Simulator</span></div></div>
      <nav aria-label="Điều hướng chính" className="main-nav">
        <button title="Kho ticket" className={view === 'workspace' ? 'nav-item active' : 'nav-item'} onClick={() => setView('workspace')}><Server size={18} /> Kho ticket <span>{tickets.length}</span></button>
        <button title="Thư viện lệnh" className={view === 'library' ? 'nav-item active' : 'nav-item'} onClick={() => { if (view !== 'library') setLibraryOrigin(view === 'guided' || view === 'exam' || view === 'stateful' || view === 'practice' ? view : 'workspace'); setLibraryFocus(undefined); setView('library') }}><BookOpen size={18} /> Thư viện lệnh</button>
        <button title="Real Lab" className={view === 'real-lab' ? 'nav-item active' : 'nav-item'} onClick={() => { history.replaceState(null, '', '#real-lab'); setView('real-lab') }}><Server size={18} /> Real Lab</button>
        <button title="Lịch sử" className={view === 'history' ? 'nav-item active' : 'nav-item'} onClick={() => setView('history')}><History size={18} /> Lịch sử</button>
        <button title="Cài đặt" className={view === 'settings' ? 'nav-item active' : 'nav-item'} onClick={() => setView('settings')}><Settings2 size={18} /> Cài đặt</button>
      </nav>
      <div className="sidebar-spacer" />
      <div className="fixture-note"><ShieldCheck size={16} /><span>Tiến độ tự lưu trên trình duyệt</span></div>
    </aside>

    <div className="main-area">
      <header className="topbar"><div className="breadcrumb">{view === 'workspace' ? 'Kho ticket' : view === 'guided' ? 'Học ticket' : view === 'practice' ? 'Luyện tự do' : view === 'stateful' ? 'Stateful Simulator' : view === 'objective' ? 'Objective Exam' : view === 'exam' ? 'Exam tự luyện' : view === 'library' ? 'Thư viện lệnh' : view === 'real-lab' ? 'Real Lab' : view === 'review' ? 'Ôn lỗi' : view === 'history' || view === 'advanced-history' ? 'Lịch sử làm bài' : 'Cài đặt'}</div><div className="topbar-right"><span className="live-dot" /> Chạy local</div></header>
      <main>
        {saveError && <div className="notice error storage-error" role="alert">Không thể lưu tiến độ. Kiểm tra dung lượng lưu trữ của trình duyệt.</div>}
        {view === 'real-lab' && <RealLabPage />}
        {(view === 'guided' || view === 'library' && libraryOrigin === 'guided') && guidedCase && <div hidden={view !== 'guided'}><GuidedWorkspace key={ticket.id} ticket={ticket} guidedCase={guidedCase} progress={progress} setProgress={setProgress} onBack={() => setView('workspace')} onOpenLibrary={id => { setLibraryOrigin('guided'); setLibraryFocus(id); setView('library') }} /></div>}
        {view === 'stateful' && guidedCase?.simulation && <StatefulWorkspace ticket={ticket} guidedCase={guidedCase} progress={progress} setProgress={setProgress} onBack={() => setView('workspace')} onOpenLibrary={id => { setLibraryOrigin('stateful'); setLibraryFocus(id); setView('library') }} onOpenExam={() => setView('objective')} />}
        {view === 'objective' && guidedCase?.objectiveExam && <ObjectiveExamWorkspace ticket={ticket} guidedCase={guidedCase} progress={progress} setProgress={setProgress} onBack={() => setView('workspace')} />}
        {view === 'exam' && <ExamWorkspace ticket={ticket} progress={progress} setProgress={setProgress} onBack={() => setView('workspace')} />}
        {view === 'library' && <CommandLibrary key={libraryFocus ?? 'all'} focusedId={libraryFocus} onBack={() => setView(libraryOrigin)} />}
        {view === 'review' && <ReviewWorkspace cases={guidedCases} progress={progress} setProgress={setProgress} onOpenTicket={id => { setSelectedId(id); setView('guided') }} onOpenRelated={(id, mode) => { setSelectedId(id); setView(mode) }} />}
        {view === 'advanced-history' && <Milestone5History progress={progress} onOpen={(id, mode) => { setSelectedId(id); setView(mode) }} />}
        {(view === 'workspace' || view === 'practice') && <>
          <section className="page-heading"><div><h1>Kho ticket</h1><p>Chọn ticket để học từng bước xử lý sự cố.</p></div><div className="progress-summary"><strong>{completedIds.size}/{tickets.length}</strong> đã hoàn thành <span>·</span> {startedCount} đang học</div></section>
          <div className="workspace-grid">
            <section className="ticket-panel" aria-label="Danh sách ticket">
              <div className="panel-heading"><div><h2>Danh sách ticket</h2><p>{visibleTickets.length} kết quả</p></div></div>
              <div className="filter-box"><div className="search-wrap"><Search size={16} /><input aria-label="Tìm ticket" placeholder="Tìm ID, triệu chứng..." value={query} onChange={event => { setKeepCurrentOpen(false); setQuery(event.target.value) }} /></div><div className="filter-row"><Select label="Chủ đề" value={topic} onChange={value => { setKeepCurrentOpen(false); setTopic(value) }} options={[['all', 'Tất cả chủ đề'], ...topics.map(([name, vi]) => [name, vi])]} /><Select label="Cấp độ" value={level} onChange={value => { setKeepCurrentOpen(false); setLevel(value) }} options={[['all', 'Mọi cấp độ'], ['0', 'L0'], ['1', 'L1'], ['2', 'L2'], ['3', 'L3']]} /></div><Select label="Trạng thái" value={status} onChange={value => { setKeepCurrentOpen(false); setStatus(value) }} options={[['all', 'Mọi trạng thái'], ['new', 'Chưa làm'], ['started', 'Đang làm'], ['completed', 'Đã hoàn thành']]} /></div>
              <div className="ticket-list" ref={ticketListRef}>{visibleTickets.length ? visibleTickets.map(item => {
                const itemStatus = guidedStatus(item.id, progress)
                return <button key={item.id} data-ticket-id={item.id} className={`ticket-row ${selectedId === item.id ? 'selected' : ''}`} onClick={() => selectTicket(item.id)} aria-current={selectedId === item.id ? 'true' : undefined}><div className="ticket-row-top"><span className="ticket-id">{item.id}</span><span className={`level level-${item.difficulty}`}>L{item.difficulty}</span></div><strong>{customerSummary(item.customer_message)}</strong><div className="ticket-row-bottom"><span>{item.topic_vi}</span><span className={`row-status ${itemStatus}`}>{itemStatus === 'completed' && <Check size={12} />}{statusText[itemStatus]}</span></div></button>
              }) : <div className="empty-list">Không có ticket phù hợp bộ lọc.</div>}</div>
            </section>
            {(visibleTickets.length || keepCurrentOpen) ? <div className="case-stack" ref={caseRef}>
              {!visibleTickets.some(item => item.id === ticket.id) && <div className="filter-note">Ticket đang mở đã đổi trạng thái và không còn trong danh sách lọc. Bạn có thể tiếp tục ghi bài hoặc chọn ticket khác.</div>}
              <section className="case-card"><div className="case-header"><div><div className="case-overline">Ticket {ticket.id}</div><h2>{customerSummary(ticket.customer_message)}</h2><div className="case-tags"><span className={`level level-${ticket.difficulty}`}>L{ticket.difficulty} · {ticket.level_label.split(' - ')[1]}</span><span className="tag">{ticket.topic_vi}</span><span className="tag">{priorityText(ticket.priority)}</span></div></div><div className="case-actions"><div className={`case-status ${guidedStatus(ticket.id, progress)}`}>{statusText[guidedStatus(ticket.id, progress)]}</div>{view === 'practice' && (hasNotes || draft.commands.length > 0 || draft.hintViewed || progress.attempts.some(attempt => attempt.ticketId === ticket.id)) && <button className="restart-button" onClick={restartTicket}><RotateCcw size={13} /> Làm lại</button>}</div></div>
                <div className="section-heading"><div className="section-icon"><FileText size={16} /></div><h3>Lời khách hàng</h3></div><div className="customer-message">{ticket.customer_message}</div>
                {guidedCase && <div className="guided-entry"><p>Nhận diện vấn đề, thu thập bằng chứng và chọn hướng xử lý.</p><button className="primary-button" onClick={continueLearning}>{guidedStatus(ticket.id, progress) === 'started' || progress.guidedDrafts[ticket.id] ? 'Tiếp tục' : 'Học ticket'} <ArrowRight size={15} /></button></div>}
              </section>

              {view === 'practice' && <>
              <section className="case-card"><div className="card-title-row"><div><div className="section-heading no-margin"><div className="section-icon terminal-icon"><Terminal size={16} /></div><h3>Điều tra sự cố</h3></div><p>{terminalProbes.length ? 'Nhập command để xem output có sẵn của ticket.' : 'Chọn hoặc nhập tác vụ kiểm tra để xem output có sẵn của ticket.'} Không chạy lệnh thật.</p></div></div>
                {terminalProbes.length > 0 && <div className="terminal"><div className="terminal-bar"><span>Terminal mô phỏng</span><span className="terminal-safe"><ShieldCheck size={13} /> Chỉ dữ liệu JSON</span></div><div className="terminal-body" ref={terminalBodyRef} aria-live="polite"><div className="terminal-welcome">Output sẽ xuất hiện sau khi bạn chọn hoặc nhập command.</div>{draft.commands.filter(entry => entry.kind === 'terminal').map(entry => <div className="terminal-entry" key={entry.id}><div className="terminal-command"><span>$</span> {entry.command} {entry.probeId && <span className="probe-id">{entry.probeId}</span>}</div><pre className={entry.supported ? '' : 'unsupported-output'}>{entry.output}</pre>{entry.supported && <button className="cite-button" onClick={() => citeEvidence(entry)}>{draft.form.evidence.includes(`${entry.probeId} (${entry.command}): ${entry.output}`) ? 'Đã thêm vào bằng chứng' : 'Thêm vào bằng chứng'}</button>}</div>)}</div><form className="terminal-input" onSubmit={event => { event.preventDefault(); runProbe(command) }}><span>$</span><input aria-label="Nhập command mô phỏng" spellCheck={false} autoComplete="off" placeholder="Nhập command để kiểm tra..." value={command} onChange={event => setCommand(event.target.value)} list={supportLevel === 'independent' ? undefined : 'legacy-command-options'} />{supportLevel !== 'independent' && <datalist id="legacy-command-options">{terminalProbes.map(probe => <option key={probe.probe_id} value={probe.command} />)}</datalist>}<button type="submit" disabled={!command.trim()} aria-label="Chạy command mô phỏng"><ArrowRight size={18} /></button></form></div>}
                <CommandQuickLookup key={ticket.id} />
                {(supportLevel === 'beginner' || supportLevel === 'normal' && (ticket.difficulty === 0 || draft.hintViewed)) && terminalProbes.length > 0 && <div className="probe-suggestions"><span>Command gợi ý</span><div>{terminalProbes.map(probe => <button key={probe.probe_id} onClick={() => runProbe(probe.command)}><Command size={13} />{probe.command}</button>)}</div></div>}
                {supportLevel === 'normal' && ticket.difficulty > 0 && !draft.hintViewed && <div className="quiet-tip"><CircleHelp size={16} /> Hãy tự chọn bước kiểm tra trước. Bạn có thể mở gợi ý khi cần.</div>}
                {investigations.length > 0 && <div className={`investigation-block ${terminalProbes.length ? '' : 'standalone'}`}><div className="investigation-title"><Server size={16} /> Kiểm tra hệ thống ngoài terminal <span>cũng chỉ là mô phỏng</span></div><form className="investigation-input" onSubmit={event => { event.preventDefault(); runProbe(investigationInput, 'investigation') }}><input aria-label="Nhập tác vụ kiểm tra mô phỏng" value={investigationInput} onChange={event => setInvestigationInput(event.target.value)} placeholder="Nhập PANEL:, BILLING: hoặc BACKUP LOG:..." /><button disabled={!investigationInput.trim()}>Kiểm tra</button></form><div className="investigation-buttons">{(supportLevel === 'beginner' || supportLevel === 'normal' && (ticket.difficulty === 0 || draft.hintViewed)) ? investigations.map(probe => <button key={probe.probe_id} onClick={() => runProbe(probe.command, 'investigation')}>{probe.command}<ArrowRight size={14} /></button>) : <span className="muted">Bạn có thể tự nhập tác vụ; chuyển sang Beginner nếu cần lựa chọn có sẵn.</span>}</div>{draft.commands.filter(entry => entry.kind === 'investigation').map(entry => <div className="investigation-result" key={entry.id}><strong>{entry.command} {entry.probeId && <span className="probe-id">{entry.probeId}</span>}</strong><pre>{entry.output}</pre>{entry.supported && <button className="cite-button" onClick={() => citeEvidence(entry)}>{draft.form.evidence.includes(`${entry.probeId} (${entry.command}): ${entry.output}`) ? 'Đã thêm vào bằng chứng' : 'Thêm vào bằng chứng'}</button>}</div>)}</div>}
                {supportLevel !== 'independent' && <div className="hint-row"><button className="text-button" onClick={loadHint}><Lightbulb size={16} /> {draft.hintViewed ? 'Xem lại gợi ý' : 'Cần gợi ý?'}</button>{hint && <div className="hint-content">{hint}</div>}</div>}
              </section>

              <section className="case-card"><div className="card-title-row"><div><div className="section-heading no-margin"><div className="section-icon note-icon"><BookOpen size={16} /></div><h3>Ghi chẩn đoán</h3></div><p>Ghi suy luận của bạn trước khi mở đáp án. Ở mức Beginner, chỉ cần điền các ô chính.</p></div><span className="autosave"><Check size={14} /> Tự động lưu</span></div><div className="form-grid">{fieldMeta.filter(field => (supportLevel !== 'beginner' && (supportLevel === 'independent' || ticket.difficulty > 0)) || ['issue', 'hypothesis', 'evidence', 'verification'].includes(field.key)).map(field => <label key={field.key} className={field.long ? 'full' : ''}><span>{field.label}</span>{field.long ? <textarea rows={3} value={draft.form[field.key]} onChange={event => updateField(field.key, event.target.value)} placeholder={field.placeholder} /> : <input value={draft.form[field.key]} onChange={event => updateField(field.key, event.target.value)} placeholder={field.placeholder} />}</label>)}</div>{(supportLevel === 'beginner' || supportLevel === 'normal' && ticket.difficulty === 0) && <details className="optional-fields"><summary>Thêm bước kiểm tra, hành động và escalation (tùy chọn)</summary><div className="form-grid">{fieldMeta.filter(field => ['nextCheck', 'action', 'escalation'].includes(field.key)).map(field => <label key={field.key} className={field.long ? 'full' : ''}><span>{field.label}</span>{field.long ? <textarea rows={3} value={draft.form[field.key]} onChange={event => updateField(field.key, event.target.value)} placeholder={field.placeholder} /> : <input value={draft.form[field.key]} onChange={event => updateField(field.key, event.target.value)} placeholder={field.placeholder} />}</label>)}</div></details>}<div className="form-footer"><div><ShieldCheck size={16} /> Ghi chú được lưu local trên trình duyệt này.</div><button className="primary-button" onClick={revealAnswer}><BookOpen size={16} /> Xem đáp án <ArrowRight size={16} /></button></div></section>

              {answer && <section className="case-card answer-card"><div className="answer-banner"><div className="answer-banner-icon"><CheckCircle2 size={20} /></div><div><h3>Đối chiếu đáp án</h3><p>So sánh với nhận định của bạn. Đây là đáp án fixture, không phải chẩn đoán production.</p></div></div><div className="answer-grid"><AnswerItem label="Chẩn đoán dự kiến" text={answer.expected_diagnosis} /><AnswerItem label="Kiểm tra tiếp" text={answer.recommended_next_checks} /><AnswerItem label="Hướng xử lý" text={answer.resolution_guidance} /><AnswerItem label="Xác minh" text={answer.verification} /><AnswerItem label="Escalation" text={answer.escalate_when} /></div><div className="warning"><AlertCircle size={17} /><span>{answer.production_warning}</span></div><div className="rubric"><div className="rubric-heading"><div><h3>Tự đánh giá theo rubric</h3><p>Chọn các tiêu chí bạn đã làm đạt. Điểm do bạn tự chấm, không phải AI grading.</p></div><strong>{scoreChecks(draft.checks, answer.scoring_rubric ?? DEFAULT_RUBRIC)}<span>/ 10</span></strong></div><div className="rubric-list">{SCORE_KEYS.map(key => <label key={key}><input type="checkbox" checked={draft.checks[key]} onChange={event => updateDraft(current => ({ checks: { ...current.checks, [key]: event.target.checked } }))} /><span>{SCORE_LABELS[key]}</span><b>+{(answer.scoring_rubric ?? DEFAULT_RUBRIC)[key]}</b></label>)}</div><button className="primary-button" onClick={saveAttempt} disabled={alreadySaved}><Check size={16} /> {alreadySaved ? 'Đã lưu lượt làm' : 'Lưu lượt làm bài'}</button></div></section>}
              {(notice || loadError) && <div className={`notice ${loadError ? 'error' : ''}`} role="status">{loadError || notice}</div>}
              </>}
            </div> : <div className="empty-case"><Search size={22} /><h2>Không có ticket phù hợp</h2><p>Thay đổi bộ lọc hoặc từ khóa tìm kiếm để tiếp tục.</p></div>}
          </div>
        </>}
        {view === 'history' && <section className="subpage"><h1>Lịch sử học ticket</h1><p>Các lượt Guided đã hoàn thành được lưu ở đây.</p><div className="history-list">{progress.guidedAttempts.map(attempt => {
          const item = tickets.find(entry => entry.id === attempt.ticketId)
          const guided = guidedCases.find(entry => entry.id === attempt.ticketId)
          const missed = guided?.questions.filter(question => attempt.outcomes?.[question.id] === false) ?? []
          return <article className="history-card" key={attempt.id}>
            <div className="history-top"><span className="ticket-id">{attempt.ticketId}</span><span>{new Date(attempt.createdAt).toLocaleString('vi-VN')}</span></div>
            <h3>{item ? customerSummary(item.customer_message) : attempt.ticketId}</h3><p>{attempt.note}</p>
            {missed.length > 0 && <details className="history-detail"><summary>{missed.length} câu cần xem lại</summary><ul>{missed.map(question => <li key={question.id}>{question.prompt}</li>)}</ul></details>}
            {!attempt.outcomes && <p className="muted">Lượt cũ chỉ lưu điểm tổng.</p>}
            <div className="history-foot"><span>{attempt.commands.filter(entry => entry.supported).length} lượt kiểm tra</span><strong>{attempt.score}/{attempt.total} câu đúng</strong><button onClick={() => { setSelectedId(attempt.ticketId); setView('guided') }}>Mở bài <ArrowRight size={14} /></button></div>
          </article>
        })}{!progress.guidedAttempts.length && <div className="empty-state"><History size={32} /><h3>Chưa hoàn thành ticket nào</h3><p>Lượt học đã nộp sẽ xuất hiện tại đây.</p><button className="primary-button" onClick={() => setView('workspace')}>Chọn ticket <ArrowRight size={15} /></button></div>}</div></section>}
        {view === 'advanced-history' && <section className="subpage"><h1>Lịch sử làm bài</h1><p>Guided chấm câu hỏi khách quan; Practice và Exam dùng rubric tự đánh giá.</p><div className="history-list">{progress.guidedAttempts.map(attempt => { const item = tickets.find(t => t.id === attempt.ticketId); const guided = guidedCases.find(t => t.id === attempt.ticketId); const missed = guided?.questions.filter(question => attempt.outcomes?.[question.id] === false) ?? []; return <article className="history-card" key={attempt.id}><div className="history-top"><span className="ticket-id">{attempt.ticketId} · Guided</span><span>{new Date(attempt.createdAt).toLocaleString('vi-VN')}</span></div><h3>{item ? customerSummary(item.customer_message) : attempt.ticketId}</h3><p>{attempt.note}</p>{missed.length > 0 && <details className="history-detail"><summary>{missed.length} câu cần xem lại</summary><ul>{missed.map(question => <li key={question.id}>{question.prompt}</li>)}</ul><button className="guided-secondary" onClick={() => setView('review')}>Mở Review Mistakes</button></details>}{!attempt.outcomes && <p className="muted">Lượt cũ chưa lưu kết quả từng câu; điểm tổng vẫn được giữ.</p>}<div className="history-foot"><span>{attempt.commands.filter(entry => entry.supported).length} probe · {attempt.hintLevel} gợi ý</span><strong>{attempt.score}/{attempt.total} câu khách quan</strong><button onClick={() => { setSelectedId(attempt.ticketId); setView('guided') }}>Mở bài <ArrowRight size={14} /></button></div></article> })}{progress.examAttempts.map(attempt => { const item = tickets.find(t => t.id === attempt.ticketId); return <article className="history-card" key={attempt.id}><div className="history-top"><span className="ticket-id">{attempt.ticketId} · Exam</span><span>{new Date(attempt.createdAt).toLocaleString('vi-VN')}</span></div><h3>{item ? customerSummary(item.customer_message) : attempt.ticketId}</h3><p>{attempt.form.hypothesis}</p><div className="history-foot"><span>{attempt.commands.filter(entry => entry.supported).length} fixture · không gợi ý</span><strong>{attempt.selfScore === undefined ? 'Chưa tự chấm' : `${attempt.selfScore}/10 · tự đánh giá`}</strong><button onClick={() => { setSelectedId(attempt.ticketId); setView('exam') }}>Mở Exam <ArrowRight size={14} /></button></div><details className="history-detail"><summary>Xem bản làm đã nộp</summary><div className="history-fields">{Object.entries(attempt.form).map(([key, value]) => <div key={key}><span>{key}</span><p>{value}</p></div>)}</div><div className="history-commands">{attempt.commands.map(entry => <div key={entry.id}><code>{entry.command}</code><pre>{entry.output}</pre></div>)}</div></details></article> })}{progress.attempts.map(attempt => { const item = tickets.find(t => t.id === attempt.ticketId); return <article className="history-card" key={attempt.id}><div className="history-top"><span className="ticket-id">{attempt.ticketId} · Practice</span><span>{new Date(attempt.createdAt).toLocaleString('vi-VN')}</span></div><h3>{item ? customerSummary(item.customer_message) : attempt.ticketId}</h3><p>{attempt.form.hypothesis || attempt.form.issue || 'Không có nội dung chẩn đoán'}</p><div className="history-foot"><span>{attempt.commands.length} bước điều tra</span><strong>{attempt.selfScore}/10 · tự đánh giá</strong><button onClick={() => openTicketFromHistory(attempt.ticketId)}>Mở ticket <ArrowRight size={14} /></button></div><details className="history-detail"><summary>Xem toàn bộ lượt làm</summary><div className="history-fields">{fieldMeta.map(field => <div key={field.key}><span>{field.label}</span><p>{attempt.form[field.key] || '—'}</p></div>)}</div><div className="history-commands"><strong>Command history</strong>{attempt.commands.length ? attempt.commands.map(entry => <div key={entry.id}><code>{entry.command}</code><pre>{entry.output}</pre></div>) : <p>Chưa chạy probe.</p>}</div></details></article> })}{!progress.attempts.length && !progress.guidedAttempts.length && !progress.examAttempts.length && <div className="empty-state"><History size={32} /><h3>Chưa có lượt làm bài</h3><p>Chọn một ticket và lưu lượt làm đầu tiên.</p><button className="primary-button" onClick={() => setView('workspace')}>Khám phá ticket <ArrowRight size={15} /></button></div>}</div></section>}
        {view === 'settings' && <section className="subpage settings-page"><div className="eyebrow"><span className="eyebrow-line" /> DỮ LIỆU HỌC TẬP</div><h1>Cài đặt & dữ liệu</h1><p>Quản lý tiến độ được lưu trên trình duyệt này.</p><div className="settings-card"><div className="settings-icon"><ShieldCheck size={22} /></div><div><h3>Về bài học</h3><p>112 tình huống luyện tập. Lệnh và tác vụ kiểm tra chỉ hiển thị kết quả đã biên soạn, không kết nối hay thay đổi VPS thật.</p></div></div><div className="settings-card"><div className="settings-icon"><ArrowDownToLine size={22} /></div><div><h3>Sao lưu tiến độ</h3><p>Xuất file JSON để sao lưu ghi chú, lịch sử lệnh và các lượt học. Nhập lại file để khôi phục trên trình duyệt khác.</p><div className="settings-actions"><button onClick={exportProgress}><ArrowDownToLine size={16} /> Xuất tiến độ</button><button onClick={() => importRef.current?.click()}><Upload size={16} /> Nhập tiến độ</button><input ref={importRef} type="file" accept="application/json,.json" hidden onChange={event => importProgress(event.target.files?.[0])} /></div></div></div><div className="settings-card"><div className="settings-icon danger-icon"><RotateCcw size={22} /></div><div><h3>Xóa dữ liệu học tập</h3><p>Xóa toàn bộ tiến độ trên trình duyệt này. Hãy xuất file JSON nếu muốn giữ bản sao.</p><button className="danger-button" onClick={resetProgress}><RotateCcw size={16} /> Đặt lại tiến độ</button></div></div>{notice && <div className="notice" role="status">{notice}</div>}</section>}
      </main>
    </div>
  </div>
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) { return <label className="select-wrap"><span className="sr-only">{label}</span><select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>{options.map(([val, text]) => <option key={val} value={val}>{text}</option>)}</select><ChevronDown size={14} /></label> }
function AnswerItem({ label, text }: { label: string; text: string }) { return <div className="answer-item"><span>{label}</span><p>{text}</p></div> }

export default App


