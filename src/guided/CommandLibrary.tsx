import { useMemo, useState } from 'react'
import { ArrowLeft, Search } from 'lucide-react'
import { commandLibrary } from './commands'
import type { CommandDoc } from './types'

const isTask = (doc: CommandDoc) => doc.knowledge?.kind === 'support_task'
const safetyLabel = (doc: CommandDoc) => doc.safety === 'read' ? 'Chỉ đọc' : doc.safety === 'privileged_read' ? 'Đọc có quyền' : 'Thay đổi hệ thống'
const searchText = (doc: CommandDoc) => [doc.command, doc.family, doc.purpose, doc.whenToUse, doc.pitfalls, ...(doc.knowledge?.options.map(option => `${option.name} ${option.purpose} ${option.when}`) ?? [])].join(' ').toLocaleLowerCase()

export function CommandCard({ selected }: { selected: CommandDoc }) {
  const knowledge = selected.knowledge
  const task = isTask(selected) ? knowledge?.task : undefined
  const first = knowledge?.examples[0]
  return <article className="library-detail">
    <div className="library-meta"><span>{selected.family}</span><span>{task ? 'Tác vụ hỗ trợ' : 'Lệnh tham khảo'}</span><span>{safetyLabel(selected)}</span><span>{selected.context}</span></div>
    <h2>{task ? selected.purpose : <code>{selected.command}</code>}</h2>
    <p className="library-lead">{selected.purpose}</p>
    <div className="library-quick">
      <h3>Xem nhanh</h3>
      <p><strong>Khi dùng:</strong> {selected.whenToUse}</p>
      {task ? <p><strong>Nơi thực hiện:</strong> {task.where}</p> : <p><strong>Cú pháp:</strong> <code>{knowledge?.syntax ?? selected.command}</code></p>}
      {first && <><p><strong>Ví dụ:</strong> {task ? first.purpose : <code>{first.command}</code>}</p><p><strong>Cách đọc:</strong> {first.interpretation}</p></>}
    </div>
    <details className="library-expanded"><summary>Chi tiết, giới hạn và quyền</summary>
      {task ? <dl>
        <div><dt>Dữ liệu cần kiểm tra</dt><dd><ul>{task.dataToCheck.map(item => <li key={item}>{item}</li>)}</ul></dd></div>
        <div><dt>Quyền / approval</dt><dd>{task.authority}</dd></div>
        <div><dt>Trạng thái quan sát</dt><dd><ul>{task.observableOutcomes.map(item => <li key={item}>{item}</li>)}</ul></dd></div>
        <div><dt>Giới hạn</dt><dd>{task.limits}</dd></div>
        <div><dt>Escalation</dt><dd>{task.escalation}</dd></div>
      </dl> : <dl>
        <div><dt>Flags / subcommands</dt><dd>{knowledge?.options.length ? <ul>{knowledge.options.map(option => <li key={option.name}><strong><code>{option.name}</code></strong>: {option.purpose} Khi dùng: {option.when} Ví dụ: <code>{option.example}</code>{option.osNote && <> OS: {option.osNote}</>}</li>)}</ul> : 'Ví dụ cơ bản không cần flag riêng.'}</dd></div>
        <div><dt>CentOS Stream 9</dt><dd><code>{selected.centos}</code></dd></div>
        <div><dt>Ubuntu</dt><dd><code>{selected.ubuntu}</code></dd></div>
        <div><dt>Quyền cần có</dt><dd>{selected.privilege}</dd></div>
      </dl>}
      <h3>{task ? 'Ví dụ trạng thái' : 'Các cách dùng'}</h3>
      {knowledge?.examples.map((example, index) => <section className="library-usage" key={index}>
        <p><strong>{example.purpose}</strong>{!task && <> — <code>{example.command}</code></>}</p>
        <p className="library-caption">Output minh họa{example.outputIsExcerpt ? ' (trích đoạn)' : ''} · {example.context}</p>
        <pre className="library-example">{example.expectedOutput || '(thường không có stdout; kiểm tra exit status)'}</pre>
        <p>{example.interpretation}</p>
      </section>)}
      <dl>
        <div><dt>Kết luận được</dt><dd>{knowledge?.proves ?? selected.interpretation}</dd></div>
        <div><dt>Chưa chứng minh</dt><dd>{knowledge?.doesNotProve ?? selected.pitfalls}</dd></div>
        <div><dt>Kiểm tra tiếp</dt><dd>{selected.followUp}</dd></div>
        <div><dt>Ticket liên quan</dt><dd>{selected.relatedTicketIds.join(', ') || 'Chưa liên kết ticket cụ thể'}</dd></div>
        <div><dt>Lưu ý an toàn</dt><dd>{selected.pitfalls}</dd></div>
        <div><dt>Mức xác minh</dt><dd>{knowledge?.verification ?? 'PENDING'}{knowledge?.sourceUrls.map(url => <> · <a key={url} href={url} target="_blank" rel="noreferrer">Nguồn chính thức</a></>)}</dd></div>
      </dl>
    </details>
  </article>
}

export function CommandQuickLookup({ initialId }: { initialId?: string }) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(initialId ?? '')
  const matches = commandLibrary.filter(doc => searchText(doc).includes(query.toLocaleLowerCase())).slice(0, 8)
  const selected = commandLibrary.find(doc => doc.id === selectedId)
  return <details className="quick-lookup"><summary>Tra nhanh lệnh / tác vụ</summary><label className="library-search"><Search size={16} /><input aria-label="Tìm giải thích lệnh" placeholder="Tìm lệnh, flag, triệu chứng..." value={query} onChange={event => setQuery(event.target.value)} /></label><div className="quick-results">{matches.map(doc => <button key={doc.id} onClick={() => setSelectedId(doc.id)}><code>{doc.command}</code><span>{safetyLabel(doc)}</span></button>)}</div>{!matches.length && <p>Không tìm thấy mục phù hợp.</p>}{selected && <div className="quick-summary"><strong>{selected.purpose}</strong><p>{selected.knowledge?.examples[0]?.interpretation ?? selected.interpretation}</p><p>{selected.pitfalls}</p></div>}</details>
}

export function CommandLibrary({ focusedId, onBack }: { focusedId?: string; onBack: () => void }) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(focusedId ?? commandLibrary[0].id)
  const filtered = useMemo(() => commandLibrary.filter(doc => searchText(doc).includes(query.toLocaleLowerCase())), [query])
  const selected = filtered.find(doc => doc.id === selectedId) ?? filtered[0]
  return <section className="library-page"><div className="library-heading"><button className="guided-back" onClick={onBack}><ArrowLeft size={15} /> Quay lại</button><h1>Kiến thức lệnh và tác vụ ({commandLibrary.length})</h1><p>Tra công dụng, flags, cách đọc output và quyền cần có. Ví dụ là tài liệu mô phỏng, không được chạy trong terminal TicketSim.</p></div><div className="library-grid"><div className="library-list"><label className="library-search"><Search size={16} /><input aria-label="Tìm lệnh" placeholder="Tìm lệnh, flag, công dụng hoặc triệu chứng..." value={query} onChange={event => setQuery(event.target.value)} /></label><div>{filtered.map(doc => <button key={doc.id} className={selected?.id === doc.id ? 'active' : ''} onClick={() => setSelectedId(doc.id)}><code>{isTask(doc) ? doc.purpose : doc.command}</code><span>{doc.family} · {doc.whenToUse}</span></button>)}{!filtered.length && <p>Không tìm thấy mục phù hợp.</p>}</div></div>{selected && <CommandCard selected={selected} />}</div></section>
}
