import type { GuidedDraft } from '../types'
import type { CommandDoc, GuidedAnswerKey, GuidedCase, GuidedProbe, GuidedStage } from './types'

export const STAGES: { id: GuidedStage; label: string }[] = [
  { id: 'triage', label: 'Nhận diện' },
  { id: 'investigate', label: 'Kiểm tra' },
  { id: 'interpret', label: 'Đọc bằng chứng' },
  { id: 'decide', label: 'Quyết định' },
  { id: 'verify', label: 'Tổng kết' },
]

export const emptyGuidedDraft = (): GuidedDraft => ({ stage: 0, responses: {}, feedback: {}, commands: [], hintLevel: 0, note: '', submitted: false })
export const normalizeGuidedCommand = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase()

export type CommandMatch =
  | { kind: 'available'; probe: GuidedProbe }
  | { kind: 'known' | 'restricted' | 'unclear'; message: string }

export function classifyGuidedCommand(input: string, probes: GuidedProbe[], library: CommandDoc[], state = 'initial'): CommandMatch {
  const normalized = normalizeGuidedCommand(input)
  if (!normalized) return { kind: 'unclear', message: 'Nhập lệnh hoặc chọn một phép kiểm tra.' }
  const probe = probes.find(item => (item.requiredState ? item.requiredState.includes(state) : state === 'initial') && [item.command, ...item.aliases].some(variant => normalizeGuidedCommand(variant) === normalized))
  if (probe) return { kind: 'available', probe }
  const known = library.find(item => [item.command, item.centos, item.ubuntu].some(variant => normalizeGuidedCommand(variant) === normalized || (item.safety !== 'change' && normalizeGuidedCommand(`sudo ${variant}`) === normalized)))
  if (known?.safety === 'change' || /^(?:sudo\s+)?(?:rm\b|reboot\b|shutdown\b|systemctl\s+(?:start|stop|restart|enable|disable|reload)\b|journalctl\s+--vacuum-\w+|mount\s+.*\bremount\b|virsh\s+(?:destroy|shutdown)\b|nmcli\s+(?:connection|con)\s+(?:down|delete|modify|up)\b|ip\s+route\s+(?:add|del|delete|replace)\b|firewall-cmd\s+--(?:add|remove)-|nft\s+(?:add|delete|flush)\b)/i.test(normalized)) {
    return { kind: 'restricted', message: 'Lệnh này thay đổi hệ thống nên không được thực hiện ở bước kiểm tra. Hãy nêu đề xuất và quyền cần có ở bước Quyết định.' }
  }
  if (known) return { kind: 'known', message: 'Lệnh có trong thư viện nhưng chưa có kết quả cho ticket này. Không tính là trả lời sai.' }
  return { kind: 'unclear', message: 'Chưa có kết quả cho lệnh này. Bạn có thể tra cú pháp trong Thư viện lệnh.' }
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
