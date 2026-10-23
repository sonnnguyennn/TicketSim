import type { Progress } from '../types'

export function Milestone5History({ progress, onOpen }: { progress: Progress; onOpen: (id: string, mode: 'stateful' | 'objective') => void }) {
  const rows = [
    ...progress.statefulAttempts.map(item => ({ id: item.id, ticketId: item.ticketId, createdAt: item.createdAt, mode: 'stateful' as const, title: `Stateful · ${item.state === 'escalated' ? 'Escalated' : 'Post-action verified'}`, detail: item.note, errors: item.errors.length })),
    ...progress.objectiveExamAttempts.map(item => ({ id: item.id, ticketId: item.ticketId, createdAt: item.createdAt, mode: 'objective' as const, title: `Objective Exam · ${item.score}/${item.total} khách quan`, detail: `${item.commands.filter(entry => entry.supported).length} fixture đã đọc`, errors: item.errors.length })),
  ].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  if (!rows.length) return null
  return <section className="subpage"><h1>Stateful & Objective Exam</h1><p>Lượt làm mới được lưu riêng. Kết quả tự đánh giá ở Legacy Exam nằm bên dưới.</p><div className="history-list">{rows.map(item => <article className="history-card" key={item.id}><div className="history-top"><span className="ticket-id">{item.ticketId} · {item.title}</span><span>{new Date(item.createdAt).toLocaleString('vi-VN')}</span></div><p>{item.detail}</p><div className="history-foot"><span>{item.errors} lỗi đưa vào Review Mistakes</span><button onClick={() => onOpen(item.ticketId, item.mode)}>Mở bài →</button></div></article>)}</div></section>
}
