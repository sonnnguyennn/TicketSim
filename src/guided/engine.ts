import type { GuidedDraft } from '../types'
import type { CommandDoc, GuidedAnswerKey, GuidedCase, GuidedProbe, GuidedStage } from './types'

export const STAGES: { id: GuidedStage; label: string }[] = [
  { id: 'triage', label: 'Nhận diện' },
  { id: 'investigate', label: 'Kiểm tra' },
  { id: 'interpret', label: 'Đọc bằng chứng' },
  { id: 'decide', label: 'Quyết định' },
  { id: 'verify', label: 'Ghi ticket' },
]

export const emptyGuidedDraft = (): GuidedDraft => ({ stage: 0, responses: {}, feedback: {}, commands: [], hintLevel: 0, note: '', submitted: false })
export const normalizeGuidedCommand = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase()

export type CommandMatch =
  | { kind: 'available'; probe: GuidedProbe }
  | { kind: 'known' | 'restricted' | 'unclear'; message: string }

export function classifyGuidedCommand(input: string, probes: GuidedProbe[], library: CommandDoc[], state = 'initial'): CommandMatch {
  const normalized = normalizeGuidedCommand(input)
  if (!normalized) return { kind: 'unclear', message: 'Hãy nhập command hoặc chọn một phép kiểm tra.' }
  const probe = probes.find(item => (item.requiredState ? item.requiredState.includes(state) : state === 'initial') && [item.command, ...item.aliases].some(variant => normalizeGuidedCommand(variant) === normalized))
  if (probe) return { kind: 'available', probe }
  const known = library.find(item => [item.command, item.centos, item.ubuntu].some(variant => normalizeGuidedCommand(variant) === normalized || (item.safety !== 'change' && normalizeGuidedCommand(`sudo ${variant}`) === normalized)))
  if (known?.safety === 'change' || /^(?:sudo\s+)?(?:rm\b|reboot\b|shutdown\b|systemctl\s+(?:start|stop|restart|enable|disable|reload)\b|journalctl\s+--vacuum-\w+|mount\s+.*\bremount\b|virsh\s+(?:destroy|shutdown)\b|nmcli\s+(?:connection|con)\s+(?:down|delete|modify|up)\b|ip\s+route\s+(?:add|del|delete|replace)\b|firewall-cmd\s+--(?:add|remove)-|nft\s+(?:add|delete|flush)\b)/i.test(normalized)) {
    return { kind: 'restricted', message: 'Đây là thao tác thay đổi hệ thống. Bài học chỉ mô phỏng bước kiểm tra; hãy đề xuất hành động và điều kiện cấp quyền ở phần Quyết định.' }
  }
  if (known) return { kind: 'known', message: 'Đây là command có trong thư viện, nhưng ticket này chưa có output mô phỏng cho nó. Không tính là trả lời sai.' }
  return { kind: 'unclear', message: 'Chưa nhận diện được command hoặc chưa có dữ liệu mô phỏng. Kiểm tra cú pháp trong Thư viện lệnh; không có lệnh nào được chạy thật.' }
}

export function gradeSelection(selected: string[], key: GuidedAnswerKey, kind: 'step_order' | 'selection' = 'selection'): boolean {
  return selected.length === key.correctIds.length && new Set(selected).size === selected.length && (kind === 'step_order'
    ? selected.every((id, index) => id === key.correctIds[index])
    : selected.every(id => key.correctIds.includes(id)))
}

export function stageComplete(guidedCase: GuidedCase, stage: GuidedStage, draft: GuidedDraft): boolean {
  if (stage === 'verify') return draft.note.replace(/\s/g, '').length >= 30 && guidedCase.questions.filter(question => question.stage === 'verify' && question.kind !== 'short_answer').every(question => !!draft.feedback[question.id])
  const questions = guidedCase.questions.filter(question => question.stage === stage && question.kind !== 'short_answer')
  const answered = questions.every(question => !!draft.feedback[question.id])
  if (stage !== 'investigate') return answered
  const needed = new Set(guidedCase.questions.filter(question => question.stage === 'interpret').flatMap(question => question.requiredProbeIds ?? []))
  return answered && [...needed].every(id => draft.commands.some(entry => entry.supported && entry.probeId === id))
}

export function objectiveScore(guidedCase: GuidedCase, draft: GuidedDraft): { score: number; total: number } {
  return { score: guidedCase.questions.filter(question => question.kind !== 'short_answer' && draft.feedback[question.id]?.correct).length, total: guidedCase.questions.filter(question => question.kind !== 'short_answer').length }
}
