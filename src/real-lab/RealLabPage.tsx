import { useState } from 'react'

type AgentStatus = { phase: string; actionsEnabled: boolean }
type LiveRun = { run_id: string; phase: string; grade_status: string | null; recovery_status: string; started_at: string | null; completed_at: string | null; evidence_note: string | null; error_code: string | null }
type LiveEvent = { sequence: number; event_type: string; metadata: { checkId?: string; outcome?: string } }
const base = 'http://127.0.0.1:4174/api/v1'
const key = () => crypto.randomUUID().replaceAll('-', '')

export function RealLabPage() {
  const [status, setStatus] = useState<AgentStatus | null>(null)
  const [pairingCode, setPairingCode] = useState('')
  const [token, setToken] = useState('')
  const [run, setRun] = useState<LiveRun | null>(null)
  const [history, setHistory] = useState<LiveRun[]>([])
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function request(path: string, method = 'GET', body?: object, bearer = token) {
    const response = await fetch(`${base}${path}`, { method, cache: 'no-store', headers: { ...(method === 'POST' ? { 'Content-Type': 'application/json', 'Idempotency-Key': key() } : {}), ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
    const data = await response.json()
    if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : `HTTP ${response.status}`)
    return data
  }
  async function perform(work: () => Promise<void>) {
    setBusy(true); setError('')
    try { await work() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể kết nối agent') } finally { setBusy(false) }
  }
  async function refresh(bearer = token) {
    const data = await request('/live-runs', 'GET', undefined, bearer)
    setHistory(data.runs)
    const latest = data.runs[0] as LiveRun | undefined
    if (latest) {
      setRun(latest)
      const detail = await request(`/live-runs/${latest.run_id}`, 'GET', undefined, bearer)
      setEvents(detail.events)
    }
  }

  return <section className="subpage real-lab-page">
    <div className="eyebrow"><span className="eyebrow-line" /> REAL LAB · LAB-WEB-001</div>
    <h1>Real Lab</h1>
    <p>Ticket khách hàng: Website không truy cập được qua HTTP. SSH vào VPS vẫn hoạt động. Hãy kiểm tra dịch vụ và khôi phục trang mẫu.</p>
    <div className="real-lab-status" role="status">
      <h2>LAB-WEB-001</h2>
      <strong>Trạng thái: {status?.actionsEnabled ? 'Đã cấu hình phiên live' : 'Chưa sẵn sàng'}</strong>
      <p>{status?.actionsEnabled ? 'Chỉ bắt đầu sau khi operator hoàn tất B5 và cấp phép riêng cho lượt thử này.' : 'Guided và terminal mô phỏng hoạt động độc lập. Real Lab chưa được kích hoạt.'}</p>
      <button type="button" disabled={busy} onClick={() => perform(async () => { const data = await request('/status'); setStatus(data) })}>Kiểm tra agent</button>
    </div>
    {status?.actionsEnabled && <div className="real-lab-grid">
      <article>
        <h2>Kết nối</h2>
        <p>Nhập mã ghép đôi hiển thị trong cửa sổ Local Agent. Mã không lưu vào tiến độ học.</p>
        <input type="password" aria-label="Mã ghép đôi" value={pairingCode} onChange={event => setPairingCode(event.target.value)} disabled={busy || !!token} />
        <button type="button" disabled={busy || !!token || !pairingCode} onClick={() => perform(async () => { const data = await request('/pair', 'POST', { code: pairingCode }, ''); setToken(data.token); setPairingCode(''); await refresh(data.token) })}>Ghép đôi</button>
        {token && <button type="button" disabled={busy} onClick={() => perform(() => refresh())}>Làm mới lịch sử</button>}
      </article>
      <article>
        <h2>Mục tiêu</h2>
        <p>Khôi phục Nginx và trang <code>TicketSim LAB-WEB-001 baseline v1</code>. Giữ SSH và cấu hình mạng nguyên vẹn.</p>
        <p>Sử dụng SSH client bên ngoài: <code>ssh lab@10.77.77.3</code></p>
        <button type="button" disabled={busy || !token || history.length > 0} onClick={() => perform(async () => { const data = await request('/live-runs', 'POST', { scenarioId: 'LAB-WEB-001' }); setRun(data.run); await refresh() })}>Bắt đầu lab</button>
        {history.length > 0 && <p>Lượt thử đầu đã được ghi nhận. Operator cần cấp phép mới cho lượt tiếp theo.</p>}
      </article>
    </div>}
    {run && <article className="real-lab-status">
      <h2>Phiên {run.run_id}</h2>
      <p>Trạng thái: <strong>{run.phase}</strong> · Bắt đầu: {run.started_at ? new Date(run.started_at).toLocaleString('vi-VN') : 'Đang chuẩn bị'}</p>
      <p>Kết quả: <strong>{run.grade_status?.toUpperCase() ?? 'Chưa chấm'}</strong> · Khôi phục: <strong>{run.recovery_status}</strong>{run.error_code ? ` · ${run.error_code}` : ''}</p>
      {run.phase === 'running' && <>
        <label htmlFor="real-lab-note">Bằng chứng kiểm tra của bạn</label>
        <textarea id="real-lab-note" maxLength={1000} value={note} onChange={event => setNote(event.target.value)} placeholder="Ghi các kiểm tra sau khi khôi phục và kết quả quan sát được" />
        <button type="button" disabled={busy} onClick={() => perform(async () => { const data = await request(`/live-runs/${run.run_id}/submit`, 'POST', { verificationNote: note }); setRun(data.run); await refresh() })}>Nộp và kiểm tra</button>
      </>}
      {run.completed_at && <p>Hoàn tất: {new Date(run.completed_at).toLocaleString('vi-VN')}</p>}
      {run.evidence_note && <p>Bằng chứng của bạn: {run.evidence_note}</p>}
      {events.some(event => event.event_type === 'grade_check') && <div>
        <h3>Kiểm tra độc lập</h3>
        <ul>{events.filter(event => event.event_type === 'grade_check').map(event => <li key={event.sequence}>{event.metadata.checkId?.replace(/^real-|\-v1$/g, '').replaceAll('-', ' ')}: <strong>{event.metadata.outcome?.toUpperCase() ?? 'UNKNOWN'}</strong></li>)}</ul>
      </div>}
      {events.some(event => event.event_type === 'baseline_checked') && <p>Kiểm tra baseline sau reset: <strong>{events.filter(event => event.event_type === 'baseline_checked').at(-1)?.metadata.outcome?.toUpperCase()}</strong></p>}
      {['restore_failed','recovery_required'].includes(run.phase) && <p>VM đang cách ly. Operator cần kiểm tra và khôi phục trước lượt tiếp theo.</p>}
    </article>}
    {history.length > 1 && <div className="real-lab-status"><h2>Lịch sử live</h2><ul>{history.map(item => <li key={item.run_id}>{item.started_at ?? item.run_id}: {item.grade_status ?? item.phase}, khôi phục {item.recovery_status}</li>)}</ul></div>}
    {error && <p role="alert">{error}</p>}
  </section>
}
