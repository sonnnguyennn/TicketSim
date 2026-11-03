import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { actionKey, labRequest } from './client'

const LabTerminal = lazy(() => import('./LabTerminal'))
type Status = { actionsEnabled: boolean; terminalEnabled?: boolean; secureTransport?: boolean }
type Run = { run_id: string; phase: string; started_at: string | null; grade_status: string | null; recovery_status: string; evidence_note: string | null; error_code: string | null; completed_at: string | null }
type Operation = { request_key: string; kind: string; status: string; error_code: string | null }
type Check = { checkedAt: string; verdict: string; checks: Record<string, string> }
type Snapshot = { terminalOnly: boolean; run: Run | null; runs: Run[]; terminal: { id: string; runId: string | null } | null; preflight: Check | null; deadlineAt: string | null; operations: Operation[]; events: { sequence: number; event_type: string; metadata: { checkId?: string; outcome?: string } }[] }
type Website = { checkedAt: string; status: number | null; contentMatches: boolean; preview: string; verdict: string }
const messages: Record<string, string> = {
  UNAUTHORIZED: 'Phiên web đã hết hạn. Operator có thể mở lại liên kết ghép đôi hiện tại; không cần restart Agent.',
  FRESH_PREFLIGHT_REQUIRED: 'Cần chạy kiểm tra môi trường mới trước khi mở terminal.',
  TERMINAL_ALREADY_HELD: 'Một phiên SSH khác đang giữ terminal. Đóng phiên trước hoặc chờ hết thời gian reconnect.',
  LEARNER_SSH_AUTH_FAILED: 'Không xác thực được SSH hoặc host key không khớp. Mật khẩu không được lưu; hãy kiểm tra lại với operator.',
  LEARNER_AUTH_CHECK_REQUIRED: 'Hãy xác thực terminal trên baseline trước khi bắt đầu lượt thử.',
  TRIAL_NOT_ARMED: 'Chưa có phê duyệt riêng cho fault và recovery. Hiện chỉ kiểm tra terminal.',
}
const phases: Record<string, string> = { preflight: 'Đang kiểm tra', baseline_ready: 'Baseline sẵn sàng', injecting: 'Đang chuẩn bị sự cố', ready: 'Đã kiểm chứng sự cố', running: 'Đang làm bài', submitting: 'Đang chấm bài', graded: 'Đã ghi kết quả', restoring: 'Đang khôi phục', verified_clean: 'Đã xác minh baseline', completed: 'Hoàn tất', restore_failed: 'Khôi phục lỗi — đang cách ly', recovery_required: 'Cần operator kiểm tra', failed_grading: 'Chưa chấm được', failed_setup: 'Chuẩn bị thất bại' }

export function RealLabPage() {
  const [status, setStatus] = useState<Status | null>(null)
  const [paired, setPaired] = useState(false)
  const [pairCode, setPairCode] = useState(() => location.hash.startsWith('#pair=') ? decodeURIComponent(location.hash.slice(6)) : '')
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [password, setPassword] = useState('')
  const [note, setNote] = useState('')
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState('')
  const [website, setWebsite] = useState<Website | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(Date.now())
  const bootstrap = useRef(false)
  const hydratedRun = useRef('')
  const active = snapshot?.run ?? null
  const pending = snapshot?.operations.some(operation => operation.status === 'pending') ?? false
  const quarantined = snapshot?.operations.some(operation => operation.status === 'unknown') || ['restore_failed', 'recovery_required'].includes(active?.phase ?? '')

  async function refresh() { const data = await labRequest('/web/state'); setSnapshot(data); return data as Snapshot }
  async function perform(work: () => Promise<unknown>) {
    setBusy(true); setError('')
    try { await work() } catch (cause) { const code = cause instanceof Error ? cause.message : 'Không thể kết nối Agent'; setError(messages[code] ?? code); if (code === 'UNAUTHORIZED') setPaired(false) }
    finally { setBusy(false) }
  }
  async function pair(code: string) { await labRequest('/pair', { code }); setPairCode(''); setPaired(true); await refresh() }
  useEffect(() => {
    if (bootstrap.current) return
    bootstrap.current = true
    if (location.hash.startsWith('#pair=')) history.replaceState(null, '', '#real-lab')
    void perform(async () => {
      const current = await labRequest('/status'); setStatus(current)
      if (!current.terminalEnabled) return
      if (pairCode) await pair(pairCode)
      else { await labRequest('/session'); setPaired(true); await refresh() }
    })
  }, [])
  useEffect(() => {
    if (!paired) return
    let polling = false
    const poll = setInterval(async () => {
      if (polling) return
      polling = true
      try { await refresh() } catch (cause) { if (cause instanceof Error && cause.message === 'UNAUTHORIZED') { setPaired(false); setError(messages.UNAUTHORIZED) } }
      finally { polling = false }
    }, 2500)
    const renew = setInterval(() => { void labRequest('/session/renew', {}).catch(() => { setPaired(false); setError(messages.UNAUTHORIZED) }) }, 2 * 60_000)
    return () => { clearInterval(poll); clearInterval(renew) }
  }, [paired])
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  useEffect(() => {
    if (!active || hydratedRun.current === active.run_id) return
    hydratedRun.current = active.run_id
    const draft = sessionStorage.getItem(`ticketsim-web-note:${active.run_id}`)
    setNote(draft ?? active.evidence_note ?? ''); setDirty(draft !== null); setSaved('')
  }, [active?.run_id])
  useEffect(() => {
    if (!dirty || !active || active.phase !== 'running' || !paired) return
    const id = active.run_id
    const timer = setTimeout(() => { void labRequest('/web/note', { runId: id, note }).then(() => {
      if (sessionStorage.getItem(`ticketsim-web-note:${id}`) === note) { sessionStorage.removeItem(`ticketsim-web-note:${id}`); setDirty(false); setSaved('Đã lưu ghi chú') }
    }).catch(() => setSaved('Chưa lưu lên Agent; bản nháp vẫn được giữ trong tab này')) }, 700)
    return () => clearTimeout(timer)
  }, [note, dirty, active?.run_id, active?.phase, paired])
  const remaining = snapshot?.deadlineAt ? Math.max(0, Math.ceil((Date.parse(snapshot.deadlineAt) - now) / 1000)) : null
  const openTerminal = () => perform(async () => {
    if (location.protocol !== 'https:') throw new Error('SECURE_TRANSPORT_REQUIRED')
    const secret = password; setPassword('')
    await labRequest('/web/terminal', { runId: active?.phase === 'running' ? active.run_id : null, password: secret })
    await refresh()
  })
  return <section className="subpage real-lab-page">
    <div className="eyebrow"><span className="eyebrow-line" /> REAL LAB · LAB-WEB-001</div><h1>Real Lab</h1>
    <p>Website không truy cập được qua HTTP, nhưng máy chủ vẫn còn đường quản lý SSH. Hãy điều tra, khôi phục trang mẫu và ghi lại cách bạn xác minh kết quả.</p>
    <div className="real-lab-status" role="status"><h2>LAB-WEB-001</h2>
      <strong>{status?.terminalEnabled ? snapshot?.terminalOnly ? 'Kiểm chứng terminal — fault và reset bị khóa' : 'Phiên web đã được cấu hình' : 'Chưa sẵn sàng'}</strong>
      {!status?.terminalEnabled && <p>Guided và terminal mô phỏng hoạt động độc lập. Real Lab chưa được kích hoạt.</p>}
      <button disabled={busy} onClick={() => perform(async () => setStatus(await labRequest('/status')))}>Kiểm tra agent</button>
    </div>
    {status?.terminalEnabled && !paired && <article className="real-lab-panel"><h2>Kết nối phiên web</h2><p>Dùng liên kết ghép đôi operator vừa mở, hoặc mã một lần do operator cung cấp.</p>
      <input type="password" aria-label="Mã ghép đôi" autoComplete="off" value={pairCode} onChange={event => setPairCode(event.target.value)} />
      <button disabled={busy || !pairCode} onClick={() => perform(() => pair(pairCode))}>Ghép đôi</button></article>}
    {paired && snapshot && <>
      <article className="real-lab-panel"><h2>Môi trường lab</h2>
        <p>Preflight: <strong>{snapshot.preflight?.verdict.toUpperCase() ?? 'Chưa kiểm tra'}</strong>{snapshot.preflight && ` · ${new Date(snapshot.preflight.checkedAt).toLocaleTimeString('vi-VN')}`}</p>
        <button disabled={busy || pending || !!active && !active.completed_at} onClick={() => perform(async () => { await labRequest('/web/preflight', {}); await refresh() })}>Kiểm tra môi trường</button>
        {snapshot.preflight && <details><summary>Các kiểm tra độc lập</summary><ul>{Object.entries(snapshot.preflight.checks).map(([id, value]) => <li key={id}>{id}: <strong>{value.toUpperCase()}</strong></li>)}</ul></details>}
        {!active && <button disabled={busy || pending || snapshot.terminalOnly || snapshot.preflight?.verdict !== 'pass' || !snapshot.terminal || !!quarantined} onClick={() => perform(async () => { await labRequest('/web/start', { scenarioId: 'LAB-WEB-001' }, actionKey('start')); await refresh() })}>Bắt đầu lab</button>}
        {pending && <p role="status">Đang xử lý. Tải lại trang sẽ theo dõi operation từ Agent, không gửi lại fault/reset.</p>}
        {snapshot.operations.filter(operation => operation.status === 'failed' || operation.status === 'unknown').map(operation => <p role="alert" key={operation.request_key}>{operation.kind}: {operation.status} · {operation.error_code}</p>)}
      </article>
      {active && <article className="real-lab-panel"><h2>{phases[active.phase] ?? active.phase}</h2>
        {active.phase === 'running' && remaining !== null && <p className="lab-timer">Còn {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</p>}
        <p>Kết quả bài: <strong>{active.grade_status?.toUpperCase() ?? 'Chưa chấm'}</strong> · Khôi phục: <strong>{active.recovery_status}</strong></p>
        {active.error_code && <p>{active.error_code}</p>}{quarantined && <p role="alert">Run đang cách ly. Operator phải kiểm tra evidence; không tự retry reset hoặc xóa lease.</p>}</article>}
      {(!active || active.phase === 'running') && !quarantined && !pending && <article className="real-lab-panel"><h2>{active ? 'Terminal làm bài' : 'Xác thực và kiểm tra terminal trên baseline'}</h2>
        {!active && <p>Chưa tạo sự cố. Chỉ dùng các lệnh đọc để kiểm chứng kết nối; không thay đổi guest trong bước này.</p>}
        {!snapshot.terminal && <form onSubmit={event => { event.preventDefault(); void openTerminal() }}><label htmlFor="learner-ssh-password">Mật khẩu SSH của tài khoản lab</label>
          <input id="learner-ssh-password" type="password" autoComplete="off" value={password} onChange={event => setPassword(event.target.value)} disabled={busy || !status?.secureTransport} />
          <button disabled={busy || !password || !status?.secureTransport || !active && snapshot.preflight?.verdict !== 'pass'}>Mở terminal</button><small>Mật khẩu chỉ dùng để xác thực qua HTTPS, không lưu vào tiến độ hoặc báo cáo.</small></form>}
        {snapshot.terminal && <><Suspense fallback={<p>Đang tải terminal…</p>}><LabTerminal sessionId={snapshot.terminal.id} /></Suspense><button disabled={busy} onClick={() => perform(async () => { await labRequest('/web/terminal/close', {}); await refresh() })}>Đóng terminal</button></>}
      </article>}
      <article className="real-lab-panel"><h2>Kiểm tra website</h2><button disabled={busy || pending} onClick={() => perform(async () => setWebsite(await labRequest('/web/website', {})))}>Kiểm tra HTTP</button>
        {website && <div><p>HTTP: <strong>{website.status ?? 'Không nhận được phản hồi'}</strong> · Nội dung mẫu: <strong>{website.contentMatches ? 'Khớp' : 'Chưa khớp'}</strong></p><small>{new Date(website.checkedAt).toLocaleString('vi-VN')}</small><pre>{website.preview}</pre></div>}</article>
      {active && <article className="real-lab-panel"><h2>Ghi chú và nộp bài</h2><label htmlFor="real-lab-note">Bằng chứng kiểm tra của bạn</label>
        <textarea id="real-lab-note" maxLength={1000} disabled={active.phase !== 'running' || pending} value={note} onChange={event => { setNote(event.target.value); setDirty(true); setSaved('Đang lưu…'); sessionStorage.setItem(`ticketsim-web-note:${active.run_id}`, event.target.value) }} placeholder="Triệu chứng, kiểm tra, kết quả, hướng xử lý và xác minh" /><small role="status">{saved}</small>
        {active.phase === 'running' && <><p>Nộp bài sẽ khóa terminal, chấm trạng thái thực tế rồi khôi phục baseline đã được phê duyệt.</p><button disabled={busy || pending || !!quarantined} onClick={() => perform(async () => { await labRequest('/web/submit', { runId: active.run_id, verificationNote: note }, actionKey(`submit:${active.run_id}`)); await refresh() })}>Nộp và kiểm tra</button></>}
        {snapshot.events.some(event => event.event_type === 'grade_check') && <ul>{snapshot.events.filter(event => event.event_type === 'grade_check').map(event => <li key={event.sequence}>{event.metadata.checkId}: <strong>{event.metadata.outcome?.toUpperCase()}</strong></li>)}</ul>}
        {snapshot.events.filter(event => event.event_type === 'baseline_checked').map(event => <p key={event.sequence}>Baseline sau reset: <strong>{event.metadata.outcome?.toUpperCase()}</strong></p>)}</article>}
      {snapshot.runs.length > 0 && <details className="real-lab-panel"><summary>Lịch sử live ({snapshot.runs.length})</summary><ul>{snapshot.runs.map(run => <li key={run.run_id}>{run.started_at ? new Date(run.started_at).toLocaleString('vi-VN') : run.run_id}: {phases[run.phase] ?? run.phase} · {run.grade_status ?? 'Chưa chấm'} · recovery {run.recovery_status}</li>)}</ul></details>}
    </>}
    {error && <p className="lab-error" role="alert">{error}</p>}
  </section>
}
