import { useEffect, useState } from 'react'

const labels = ['Issue', 'Findings', 'Next Action', 'Verification', 'Status'] as const
type NoteLabel = typeof labels[number]

export function parseReferenceNote(note: string): { label: NoteLabel; value: string }[] | null {
  const lines = note.split(/\r?\n/).filter(line => line.trim())
  if (lines.length !== labels.length) return null
  const values = new Map<NoteLabel, string>()
  for (const line of lines) {
    const colon = line.indexOf(':')
    if (colon < 0) return null
    const label = line.slice(0, colon).trim() as NoteLabel
    const value = line.slice(colon + 1).trim()
    if (!labels.includes(label) || !value || values.has(label)) return null
    values.set(label, value)
  }
  return labels.map(label => ({ label, value: values.get(label)! }))
}

export function ReferenceNote({ note }: { note: string }) {
  const [copyState, setCopyState] = useState('')
  const fields = parseReferenceNote(note)
  useEffect(() => setCopyState(''), [note])
  async function copyNote() {
    try {
      await navigator.clipboard.writeText(note)
      setCopyState('Đã sao chép.')
    } catch {
      setCopyState('Không thể sao chép trên trình duyệt này.')
    }
  }
  return <section className="guided-model" aria-labelledby="guided-reference-title" lang="en">
    <div className="guided-model-heading"><h4 id="guided-reference-title">Reference ticket summary</h4><button type="button" onClick={copyNote}>Copy note</button></div>
    {fields ? <dl className="guided-reference-fields">{fields.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : <pre className="guided-reference-raw">{note}</pre>}
    {copyState && <span className="guided-copy-status" role="status" lang="vi">{copyState}</span>}
  </section>
}
