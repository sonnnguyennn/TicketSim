import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

export default function LabTerminal({ sessionId }: { sessionId: string }) {
  const host = useRef<HTMLDivElement>(null)
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState('Đang kết nối terminal…')
  useEffect(() => {
    if (!host.current) return
    let disposed = false
    let socket: WebSocket | null = null
    let paused = false
    const terminal = new Terminal({ cursorBlink: true, fontSize: 14, fontFamily: 'Consolas, monospace', scrollback: 1500, screenReaderMode: true,
      linkHandler: { activate: () => {} }, theme: { background: '#132330', foreground: '#e5f0fa' } })
    const fit = new FitAddon()
    terminal.loadAddon(fit); terminal.open(host.current)
    terminal.parser.registerOscHandler(52, () => true)
    const send = (data: object) => { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data)) }
    const input = terminal.onData(data => { if (!paused) send({ type: 'input', data }) })
    const resize = terminal.onResize(({ rows, cols }) => { if (rows >= 2 && cols >= 10) send({ type: 'resize', rows: Math.min(rows, 200), cols: Math.min(cols, 400) }) })
    const observer = new ResizeObserver(() => { if (!disposed) fit.fit() })
    observer.observe(host.current)
    const paste = (event: ClipboardEvent) => {
      const text = event.clipboardData?.getData('text') ?? ''
      if (text.includes('\n') && !window.confirm('Nội dung dán có nhiều dòng và có thể thực thi lệnh. Bạn muốn dán vào guest lab?')) { event.preventDefault(); event.stopImmediatePropagation() }
    }
    host.current.addEventListener('paste', paste, true)
    const container = host.current
    const timer = setTimeout(() => {
      socket = new WebSocket(`wss://${location.host}/api/v1/web/terminal/${sessionId}`)
      socket.binaryType = 'arraybuffer'
      socket.onopen = () => { if (disposed) return; setStatus('Đã kết nối · Ubuntu guest · lab'); container.scrollIntoView({ block: 'center' }); fit.fit(); send({ type: 'resize', rows: Math.max(2, terminal.rows), cols: Math.max(10, terminal.cols) }); terminal.focus() }
      socket.onmessage = event => {
        if (disposed) return
        if (event.data instanceof ArrayBuffer) terminal.write(new Uint8Array(event.data))
        else { try { const frame = JSON.parse(event.data); paused = frame.type === 'pause'; setStatus(paused ? 'Đang chờ guest đọc input…' : 'Đã kết nối · Ubuntu guest · lab') } catch { socket?.close() } }
      }
      socket.onclose = () => { if (!disposed) setStatus('Terminal đã ngắt. Kết nối lại trong 60 giây để tiếp tục phiên SSH.') }
      socket.onerror = () => { if (!disposed) setStatus('Không kết nối được terminal. Kiểm tra phiên đăng nhập và trạng thái run.') }
    }, 250)
    return () => { disposed = true; clearTimeout(timer); observer.disconnect(); container.removeEventListener('paste', paste, true); socket?.close(); input.dispose(); resize.dispose(); terminal.dispose() }
  }, [sessionId, attempt])
  return <section className="live-terminal" aria-label="Terminal SSH thật trong Ubuntu guest">
    <div className="live-terminal-toolbar"><span role="status">{status}</span><button type="button" onClick={() => { setStatus('Đang kết nối lại…'); setAttempt(value => value + 1) }}>Kết nối lại</button></div>
    <div ref={host} className="live-terminal-screen" />
    <p>Terminal này chạy trong guest lab thật. Ctrl+C để ngắt lệnh; không có Windows host shell. Input và mật khẩu không được ghi vào lịch sử ứng dụng.</p>
  </section>
}
