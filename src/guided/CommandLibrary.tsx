import { useMemo, useState } from 'react'
import { ArrowLeft, Search } from 'lucide-react'
import { commandLibrary } from './commands'
import type { CommandDoc, CommandOption } from './types'

const isTask = (doc: CommandDoc) => doc.knowledge?.kind === 'support_task'
const safetyLabel = (doc: CommandDoc) => doc.safety === 'read' ? 'Chỉ đọc' : doc.safety === 'privileged_read' ? 'Cần quyền đọc' : 'Cần phê duyệt thay đổi'
const searchText = (doc: CommandDoc) => [doc.command, doc.family, doc.purpose, doc.whenToUse, doc.pitfalls, doc.exampleOutput, ...(doc.knowledge?.options.map(option => `${option.name} ${option.purpose} ${option.when}`) ?? []), ...(doc.knowledge?.task?.dataToCheck ?? []), ...(doc.knowledge?.task?.observableOutcomes ?? [])].join(' ').toLocaleLowerCase()
const same = (left: string, right: string) => left.trim().toLocaleLowerCase() === right.trim().toLocaleLowerCase()
const partLabel: Record<CommandOption['kind'], string> = { flag: '', subcommand: 'Lệnh con', argument: 'Đối số', database: 'Cơ sở dữ liệu', target: 'Đích/loại truy vấn', filter: 'Bộ lọc', command: 'Lệnh riêng' }

function ShellCard({ selected }: { selected: CommandDoc }) {
  const knowledge = selected.knowledge!
  const options = knowledge.options
  const showDistro = selected.centos !== selected.ubuntu
  const needsApproval = selected.safety === 'change' && !/quyền|approval|phê duyệt/i.test(selected.pitfalls)
  const followUp = !same(selected.followUp, selected.pitfalls) ? selected.followUp : ''
  const hasNotes = !!(selected.pitfalls || followUp || needsApproval || selected.safety === 'privileged_read' || showDistro)
  return <article className="library-detail">
    <h2><code>{selected.command}</code></h2>
    <p className="library-lead">{selected.purpose}</p>
    {!same(selected.whenToUse, knowledge.examples[0]?.purpose ?? '') && <p className="library-context"><strong>Khi dùng:</strong> {selected.whenToUse}</p>}
    <section className="library-section"><h3>Cú pháp</h3><pre className="library-syntax"><code>{knowledge.syntax}</code></pre>
    </section>
    {options.length > 0 && <section className="library-section"><h3>Thành phần cần biết</h3><ul className="library-options">{options.map(option => <li key={option.name}>{partLabel[option.kind] && <><span className="library-part-kind">{partLabel[option.kind]}</span>{' '}</>}<code>{option.name}</code> — {option.purpose}{option.kind === 'flag' && !same(option.when, option.purpose) && <small>{option.when}</small>}{option.osNote && (!showDistro || !/Ubuntu|CentOS/i.test(option.osNote)) && <small>{option.osNote}</small>}</li>)}</ul></section>}
    <section className="library-section"><h3>Ví dụ và cách đọc</h3>{knowledge.examples.slice(0, 3).map((example, index) => <section className="library-usage" key={index}>
        <h4>{example.purpose}</h4><pre className="library-syntax"><code>{example.command}</code></pre>
        <p className="library-caption">{example.outputIsExcerpt ? 'Output mẫu — trích đoạn' : 'Output mẫu'}{example.expectedOutput === '' ? ' — stdout rỗng' : ''}{example.exitStatus !== undefined ? ` · exit status ${example.exitStatus}` : ''}</p>
        {example.expectedOutput !== '' && <pre className="library-example">{example.expectedOutput}</pre>}
        <p>{example.interpretation}</p>
      </section>)}</section>
    {hasNotes && <details className="library-expanded library-notes"><summary>Lưu ý khi cần</summary><ul>{selected.pitfalls && <li>{selected.pitfalls}</li>}{needsApproval && <li>Thay đổi hệ thống cần phê duyệt, phạm vi và phương án khôi phục.</li>}{selected.safety === 'privileged_read' && selected.privilege !== 'user' && <li>Cần quyền đọc phù hợp: {selected.privilege}.</li>}{followUp && <li><strong>Kiểm tra tiếp:</strong> {followUp}</li>}{showDistro && <li>Khác biệt distro: CentOS Stream 9 dùng <code>{selected.centos}</code>; Ubuntu dùng <code>{selected.ubuntu}</code>.</li>}</ul></details>}
  </article>
}

function TaskCard({ selected }: { selected: CommandDoc }) {
  const task = selected.knowledge!.task!
  return <article className="library-detail library-task">
    <h2>{selected.purpose}</h2>
    <p className="library-lead">{selected.whenToUse}</p>
    <section className="library-section"><h3>Nơi quan sát hoặc xử lý</h3><p>{task.where}</p></section>
    <section className="library-section"><h3>Dữ liệu cần kiểm tra</h3><ul>{task.dataToCheck.map(item => <li key={item}>{item}</li>)}</ul></section>
    <section className="library-section"><h3>Ý nghĩa kết quả</h3><ul>{task.observableOutcomes.map(item => <li key={item}>{item}</li>)}</ul><p>{task.limits}</p></section>
    <section className="library-section"><h3>Quyền và chuyển cấp</h3><p>{task.authority}</p><p>{task.escalation}</p></section>
  </article>
}

export function CommandCard({ selected }: { selected: CommandDoc }) {
  return isTask(selected) ? <TaskCard selected={selected} /> : <ShellCard selected={selected} />
}

export function CommandQuickLookup({ initialId }: { initialId?: string }) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(initialId ?? '')
  const filtered = commandLibrary.filter(doc => searchText(doc).includes(query.toLocaleLowerCase()))
  const selected = filtered.find(doc => doc.id === selectedId) ?? filtered[0] ?? commandLibrary.find(doc => doc.id === selectedId)
  const matches = selected && filtered.includes(selected) ? [selected, ...filtered.filter(doc => doc.id !== selected.id)].slice(0, 8) : filtered.slice(0, 8)
  const example = selected?.knowledge?.examples[0]
  return <details className="quick-lookup"><summary>Tra nhanh lệnh / tác vụ</summary><label className="library-search"><Search size={16} /><input aria-label="Tìm giải thích lệnh" placeholder="Tìm lệnh, flag, triệu chứng..." value={query} onChange={event => setQuery(event.target.value)} /></label><div className="quick-results">{matches.map(doc => <button key={doc.id} className={selected?.id === doc.id ? 'active' : ''} aria-current={selected?.id === doc.id ? 'true' : undefined} onClick={() => setSelectedId(doc.id)}>{isTask(doc) ? <strong>{doc.purpose}</strong> : <code>{doc.command}</code>}{doc.safety !== 'read' && <span>{safetyLabel(doc)}</span>}</button>)}</div>{!matches.length && <p>Không tìm thấy mục phù hợp.</p>}{selected && <div className="quick-summary"><h3>Đang xem: {isTask(selected) ? selected.purpose : <code>{selected.command}</code>}</h3>{!isTask(selected) && <p>{selected.purpose}</p>}{isTask(selected) ? <p><strong>Nơi kiểm tra:</strong> {selected.knowledge?.task?.where}</p> : example && <><p><strong>Ví dụ:</strong> <code>{example.command}</code> — {example.purpose}</p><p><strong>Output mẫu:</strong> {example.expectedOutput.split('\n')[0] || 'stdout rỗng'}</p><p><strong>Cách đọc:</strong> {example.interpretation}</p></>}{selected.safety !== 'read' && <p>{safetyLabel(selected)}</p>}</div>}</details>
}

export function CommandLibrary({ focusedId, onBack }: { focusedId?: string; onBack: () => void }) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(focusedId ?? commandLibrary[0].id)
  const filtered = useMemo(() => commandLibrary.filter(doc => searchText(doc).includes(query.toLocaleLowerCase())), [query])
  const selected = filtered.find(doc => doc.id === selectedId) ?? filtered[0]
  return <section className="library-page"><div className="library-heading"><button className="guided-back" onClick={onBack}><ArrowLeft size={15} /> Quay lại</button><h1>Kiến thức lệnh và tác vụ ({commandLibrary.length})</h1><p>Ví dụ và tác vụ support là tài liệu mô phỏng; quyền thao tác và màn hình provider cần đối chiếu SOP nội bộ. Terminal TicketSim không thực thi lệnh.</p></div><div className="library-grid"><div className="library-list"><label className="library-search"><Search size={16} /><input aria-label="Tìm lệnh" placeholder="Tìm lệnh, flag, công dụng hoặc triệu chứng..." value={query} onChange={event => setQuery(event.target.value)} /></label><div>{filtered.map(doc => <button key={doc.id} className={selected?.id === doc.id ? 'active' : ''} onClick={() => setSelectedId(doc.id)}><code>{isTask(doc) ? doc.purpose : doc.command}</code><span>{doc.family} · {doc.whenToUse}</span></button>)}{!filtered.length && <p>Không tìm thấy mục phù hợp.</p>}</div></div>{selected && <CommandCard selected={selected} />}</div></section>
}
