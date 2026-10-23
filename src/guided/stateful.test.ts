import { describe, expect, it } from 'vitest'
import guidedPublic from '../data/guided-public.json'
import { commandLibrary } from './commands'
import type { GuidedCase } from './types'
import { applySimulatedAction, emptyStatefulDraft, runStatefulFixture, verificationReady } from './stateful'

const ssh = (guidedPublic as GuidedCase[]).find(item => item.id === 'VPS-01-001')!
const run = (draft: ReturnType<typeof emptyStatefulDraft>, command: string) => runStatefulFixture(command, ssh, commandLibrary, draft).draft

describe('first stateful pilot: SSH stopped', () => {
  it('starts without root cause, rejects unsupported and unsafe actions, and gates change on evidence and approval', () => {
    let draft = emptyStatefulDraft()
    expect(ssh.probes.filter(probe => !probe.requiredState).every(probe => !/root cause/i.test(probe.output))).toBe(true)
    draft = run(draft, 'uname -a')
    expect(draft.commands[0].supported).toBe(false)
    expect(draft.commands[0].output).toMatch(/chưa/i)
    expect(applySimulatedAction(ssh, draft, 'start', true).category).toBe('missing_evidence')
    expect(applySimulatedAction(ssh, draft, 'reboot', true).draft.state).toBe('initial')
    for (const command of ['systemctl status sshd', 'ss -ltnp', 'journalctl -u sshd -n 50 --no-pager']) draft = run(draft, command)
    expect(applySimulatedAction(ssh, draft, 'start', false).category).toBe('unsafe_action')
    draft = applySimulatedAction(ssh, draft, 'start', true).draft
    expect(draft.state).toBe('changed')
    expect(verificationReady(ssh, draft)).toBe(false)
    draft = run(draft, 'systemctl status sshd')
    expect(draft.commands.at(-1)?.output).toContain('active (running)')
    expect(draft.commands[1].output).toContain('inactive')
    draft = run(draft, 'sudo systemctl status sshd')
    expect(draft.commands.at(-1)?.output).toContain('active (running)')
    draft = run(draft, 'systemctl restart sshd')
    expect(draft.commands.at(-1)?.supported).toBe(false)
    expect(draft.commands.at(-1)?.output).toMatch(/thay đổi hệ thống/i)
    for (const command of ['ss -ltnp', 'ssh -o BatchMode=yes admin@192.0.2.25']) draft = run(draft, command)
    expect(verificationReady(ssh, draft)).toBe(true)
    expect(draft.commands.at(-1)?.output).toContain('Permission denied')
  })
})

describe('all authored stateful incidents', () => {
  const pilots = (guidedPublic as GuidedCase[]).filter(item => item.simulation)
  it('covers six distinct L1 troubleshooting outcomes with explicit verification', () => {
    expect(pilots.map(item => item.id).sort()).toEqual(['VPS-01-001', 'VPS-02-001', 'VPS-03-001', 'VPS-05-001', 'VPS-05-004', 'VPS-08-003'])
    for (const guidedCase of pilots) {
      const allowed = guidedCase.simulation!.transitions.find(item => item.allowed)!
      const blocked = guidedCase.simulation!.transitions.find(item => !item.allowed)!
      expect(commandLibrary.some(doc => doc.id === allowed.commandId && doc.safety === 'change'), guidedCase.id).toBe(true)
      let draft = emptyStatefulDraft()
      expect(applySimulatedAction(guidedCase, draft, blocked.actionId, true).draft.state, guidedCase.id).toBe('initial')
      expect(applySimulatedAction(guidedCase, draft, allowed.actionId, true).category, guidedCase.id).toBe('missing_evidence')
      for (const id of allowed.requiredProbeIds) {
        const probe = guidedCase.probes.find(item => item.id === id)!
        const result = runStatefulFixture(probe.command, guidedCase, commandLibrary, draft)
        expect(result.entry.output, `${guidedCase.id}/${id}`).toBe(probe.output)
        draft = result.draft
      }
      if (allowed.requiresApproval) expect(applySimulatedAction(guidedCase, draft, allowed.actionId, false).category, guidedCase.id).toBe('unsafe_action')
      draft = applySimulatedAction(guidedCase, draft, allowed.actionId, true).draft
      expect(draft.state, guidedCase.id).toBe(allowed.to)
      expect(verificationReady(guidedCase, draft), guidedCase.id).toBe(false)
      for (const id of guidedCase.simulation!.verificationProbeIds) {
        const probe = guidedCase.probes.find(item => item.id === id)!
        expect(probe.requiredState, `${guidedCase.id}/${id}`).toContain(draft.state)
        draft = runStatefulFixture(probe.command, guidedCase, commandLibrary, draft).draft
        expect(draft.commands.at(-1)?.output, `${guidedCase.id}/${id}`).toBe(probe.output)
      }
      expect(verificationReady(guidedCase, draft), guidedCase.id).toBe(true)
      expect(guidedCase.objectiveExam, guidedCase.id).toBeDefined()
    }
  })
})
