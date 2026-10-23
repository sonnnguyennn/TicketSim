import type { ExamDraft, Ticket } from './types'

export function examMissing(draft: ExamDraft, ticket: Ticket): string[] {
  const seen = new Set(draft.commands.filter(entry => entry.supported).map(entry => entry.probeId))
  const missing: string[] = []
  if (!ticket.probe_outputs.every(probe => seen.has(probe.probe_id))) missing.push('thu thập đủ hai fixture P1 và P2')
  const fields: { key: keyof ExamDraft['form']; label: string; min: number }[] = [
    { key: 'symptom', label: 'triệu chứng', min: 10 },
    { key: 'hypothesis', label: 'giả thuyết và mức chắc chắn', min: 20 },
    { key: 'evidence', label: 'bằng chứng', min: 20 },
    { key: 'action', label: 'xử lý an toàn hoặc escalation', min: 20 },
    { key: 'verification', label: 'xác minh', min: 20 },
  ]
  for (const field of fields) if (draft.form[field.key].replace(/\s/g, '').length < field.min) missing.push(`ghi ${field.label} (${field.min} ký tự trở lên)`)
  return missing
}
