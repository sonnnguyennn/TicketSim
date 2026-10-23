import { useMemo, useState } from 'react'
import { ArrowLeft, Search } from 'lucide-react'
import { commandLibrary } from './commands'
import type { CommandDoc } from './types'

export function CommandCard({ selected }: { selected: CommandDoc }) {
  return <article className="library-detail"><div className="library-meta"><span>{selected.family}</span><span>{selected.safety === 'read' ? 'Chỉ đọc' : selected.safety === 'privileged_read' ? 'Đọc có quyền' : 'Thay đổi hệ thống'}</span><span>{selected.context}</span></div><h2><code>{selected.command}</code></h2><p className="library-lead">{selected.purpose}</p><dl><div><dt>Flags / tham số</dt><dd>{selected.flags}</dd></div><div><dt>CentOS Stream 9</dt><dd><code>{selected.centos}</code></dd></div><div><dt>Ubuntu</dt><dd><code>{selected.ubuntu}</code></dd></div><div><dt>Ví dụ output</dt><dd><pre className="library-example">{selected.exampleOutput}</pre></dd></div><div><dt>Cách đọc</dt><dd>{selected.interpretation}</dd></div><div><dt>Khi nào dùng</dt><dd>{selected.whenToUse}</dd></div><div><dt>Kiểm tra tiếp</dt><dd>{selected.followUp}</dd></div><div><dt>Ticket liên quan</dt><dd>{selected.relatedTicketIds.join(', ') || 'Chưa liên kết ticket cụ thể'}</dd></div><div><dt>Quyền cần có</dt><dd>{selected.privilege}</dd></div><div><dt>Lưu ý</dt><dd>{selected.pitfalls}</dd></div></dl></article>
}

export function CommandQuickLookup({ initialId }: { initialId?: string }) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(initialId ?? '')
  const matches = commandLibrary.filter(doc => `${doc.command} ${doc.family} ${doc.purpose} ${doc.whenToUse}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
  const selected = commandLibrary.find(doc => doc.id === selectedId)
  return <details className="quick-lookup"><summary>Tra giải thích command ngay tại ticket</summary><label className="library-search"><Search size={16} /><input aria-label="Tìm giải thích command" placeholder="Tìm lệnh, triệu chứng..." value={query} onChange={event => setQuery(event.target.value)} /></label><div className="quick-results">{matches.map(doc => <button key={doc.id} onClick={() => setSelectedId(doc.id)}><code>{doc.command}</code><span>{doc.safety === 'change' ? 'Thay đổi hệ thống' : doc.safety === 'privileged_read' ? 'Đọc có quyền' : 'Chỉ đọc'}</span></button>)}</div>{selected && <CommandCard selected={selected} />}</details>
}

export function CommandLibrary({ focusedId, onBack }: { focusedId?: string; onBack: () => void }) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(focusedId ?? commandLibrary[0].id)
  const filtered = useMemo(() => commandLibrary.filter(doc => `${doc.command} ${doc.family} ${doc.purpose} ${doc.whenToUse}`.toLowerCase().includes(query.toLowerCase())), [query])
  const selected = filtered.find(doc => doc.id === selectedId) ?? filtered[0]
  return <section className="library-page"><div className="library-heading"><button className="guided-back" onClick={onBack}><ArrowLeft size={15} /> Quay lại</button><h1>Thư viện lệnh ({commandLibrary.length})</h1><p>Tra mục đích, cách đọc output và giới hạn an toàn. Các command ở đây chỉ là tài liệu; output chỉ xuất hiện khi ticket có fixture phù hợp.</p></div><div className="library-grid"><div className="library-list"><label className="library-search"><Search size={16} /><input aria-label="Tìm command" placeholder="Tìm command hoặc mục đích..." value={query} onChange={event => setQuery(event.target.value)} /></label><div>{filtered.map(doc => <button key={doc.id} className={selected?.id === doc.id ? 'active' : ''} onClick={() => setSelectedId(doc.id)}><code>{doc.command}</code><span>{doc.family} · {doc.purpose}</span></button>)}{!filtered.length && <p>Không tìm thấy command phù hợp.</p>}</div></div>{selected && <CommandCard selected={selected} />}</div></section>
}
