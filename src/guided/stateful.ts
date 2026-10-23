import type { CommandEntry, LearningError, StatefulDraft } from '../types'
import { classifyGuidedCommand } from './engine'
import type { CommandDoc, GuidedCase, SimulationTransition } from './types'

export const emptyStatefulDraft = (): StatefulDraft => ({ state: 'initial', commands: [], approval: false, note: '', completed: false, errors: [] })

export function runStatefulFixture(input: string, guidedCase: GuidedCase, library: CommandDoc[], draft: StatefulDraft, now = new Date().toISOString()): { entry: CommandEntry; draft: StatefulDraft } {
  const result = classifyGuidedCommand(input, guidedCase.probes, library, draft.state)
  const entry: CommandEntry = { id: crypto.randomUUID(), command: input.trim(), output: result.kind === 'available' ? result.probe.output : result.message, supported: result.kind === 'available', probeId: result.kind === 'available' ? result.probe.id : undefined, kind: result.kind === 'available' && result.probe.context === 'panel' ? 'investigation' : 'terminal', at: now, state: draft.state }
  return { entry, draft: { ...draft, commands: [...draft.commands, entry] } }
}

export type ActionResult = { draft: StatefulDraft; ok: boolean; category?: LearningError['category']; message: string }
export function applySimulatedAction(guidedCase: GuidedCase, draft: StatefulDraft, actionId: string, approved: boolean, now = new Date().toISOString()): ActionResult {
  const transition = guidedCase.simulation?.transitions.find(item => item.actionId === actionId && item.from === draft.state)
  if (!transition) return { draft, ok: false, category: 'knowledge', message: 'Hành động không có trong trạng thái mô phỏng này.' }
  if (!transition.allowed) return reject(draft, transition, transition.category ?? 'unsafe_action', transition.feedback, now)
  const missing = transition.requiredProbeIds.filter(id => !draft.commands.some(entry => entry.supported && entry.probeId === id && entry.state === transition.from))
  if (missing.length) return reject(draft, transition, 'missing_evidence', `Cần thu thập thêm bằng chứng ${missing.join(', ')} trước hành động này.`, now)
  if (transition.requiresApproval && !approved) return reject(draft, transition, 'unsafe_action', 'Cần xác nhận quyền và kế hoạch an toàn trước thao tác thay đổi.', now)
  return { ok: true, message: transition.feedback, draft: { ...draft, state: transition.to, actionId, actionOutput: transition.output, actionFeedback: transition.feedback, approval: approved } }
}

function reject(draft: StatefulDraft, transition: SimulationTransition, category: LearningError['category'], message: string, now: string): ActionResult {
  return { draft: { ...draft, actionFeedback: message, actionOutput: transition.output, errors: [...draft.errors, { category, detail: message, at: now }] }, ok: false, category, message }
}

export function verificationReady(guidedCase: GuidedCase, draft: StatefulDraft): boolean {
  if (!guidedCase.simulation || draft.state === 'initial' || !draft.actionId) return false
  return guidedCase.simulation.verificationProbeIds.every(id => draft.commands.some(entry => entry.supported && entry.probeId === id && entry.state === draft.state))
}

export function canDocument(guidedCase: GuidedCase, draft: StatefulDraft): boolean {
  return verificationReady(guidedCase, draft) && draft.note.replace(/\s/g, '').length >= 30
}
