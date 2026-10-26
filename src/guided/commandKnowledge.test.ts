import { describe, expect, it } from 'vitest'
import { commandLibrary } from './commands'
import publicCases from '../data/guided-public.json'

describe('D2 command knowledge', () => {
  it('preserves every ID and Guided reference while separating support tasks', () => {
    const ids = new Set(commandLibrary.map(card => card.id))
    expect(commandLibrary).toHaveLength(122)
    expect(ids.size).toBe(122)
    for (const item of publicCases) {
      for (const probe of item.probes) if (probe.commandId) expect(ids.has(probe.commandId), `${item.id}/${probe.id}`).toBe(true)
      for (const question of item.questions) if (question.commandId) expect(ids.has(question.commandId), `${item.id}/${question.id}`).toBe(true)
    }
    expect(commandLibrary.filter(card => card.knowledge?.kind === 'support_task')).toHaveLength(20)
    expect(commandLibrary.filter(card => card.knowledge?.kind === 'shell')).toHaveLength(102)
    for (const card of commandLibrary) {
      const knowledge = card.knowledge!
      expect(knowledge.examples.length, card.id).toBeGreaterThan(0)
      expect(knowledge.examples[0].interpretation.length, card.id).toBeGreaterThan(10)
      if (card.context === 'panel') {
        expect(knowledge.kind, card.id).toBe('support_task')
        expect(knowledge.verification, card.id).toBe('INTERNAL_SOP_REQUIRED')
        expect(knowledge.task?.authority.length, card.id).toBeGreaterThan(10)
      } else {
        expect(knowledge.kind, card.id).toBe('shell')
        expect(knowledge.syntax, card.id).toBe(card.command)
      }
    }
  })

  it('keeps change actions gated and does not conflate shell pipelines with command flags', () => {
    for (const id of ['systemctl-start', 'journal-vacuum', 'ip-route-add', 'systemctl-restart', 'nmcli-down', 'rm-rf', 'virsh-destroy', 'registrar-change', 'storage-escalation']) {
      expect(commandLibrary.find(card => card.id === id)?.safety).toBe('change')
    }
    const ssh = commandLibrary.find(card => card.id === 'ssh-vvv')!
    expect(ssh.knowledge!.options.map(option => option.name)).toContain('-o BatchMode=yes')
    expect(ssh.knowledge!.examples.some(example => example.command.includes('BatchMode=yes'))).toBe(true)
    expect(commandLibrary.find(card => card.id === 'sshd-effective')?.command).toContain("grep '^port '")
    expect(commandLibrary.find(card => card.id === 'ps-cpu')?.knowledge?.options.find(option => option.name === 'head')?.purpose).toContain('shell')
    expect(commandLibrary.find(card => card.id === 'tcpdump-ssh')?.knowledge?.options.find(option => option.name === 'tcp port 22')?.purpose).toContain('BPF')
  })

  it('keeps lookup examples and syntax components consistent with their output', () => {
    const getent = commandLibrary.find(card => card.id === 'getent-passwd')!.knowledge!
    expect(getent.options.find(option => option.name === 'passwd')?.kind).toBe('database')
    expect(getent.options.find(option => option.name === 'USER')?.kind).toBe('argument')
    expect(getent.examples).toHaveLength(2)
    expect(getent.examples[0].command).toBe('getent passwd webapp')
    expect(getent.examples[0].expectedOutput).toMatch(/^webapp:/)
    expect(getent.examples[0].exitStatus).toBe(0)
    expect(getent.examples[1].command).toBe('getent passwd admin')
    expect(getent.examples[1].expectedOutput).toBe('')
    expect(getent.examples[1].exitStatus).toBe(2)
    for (const id of ['ss-ltnp', 'ip-route', 'ip-family-addr']) {
      const example = commandLibrary.find(card => card.id === id)!.knowledge!.examples[0]
      expect(example.expectedOutput).not.toBe('')
      expect(example.interpretation, id).not.toMatch(/^Không có (listener|inet|dòng default)/)
    }
    const ss = commandLibrary.find(card => card.id === 'ss-ltnp')!.knowledge!
    expect(ss.examples[0].expectedOutput).not.toContain('users:')
    expect(ss.examples[0].interpretation).not.toMatch(/(?:thuộc|của) sshd/i)
    expect(ss.examples[1].expectedOutput).toContain('users:')
    for (const card of commandLibrary) {
      const examples = card.knowledge!.examples
      expect(examples.length, card.id).toBeGreaterThanOrEqual(1)
      expect(examples.length, card.id).toBeLessThanOrEqual(3)
      for (const example of examples) {
        expect(example.command.trim() || card.knowledge!.kind === 'support_task', card.id).toBeTruthy()
        expect(example.interpretation.trim().length, card.id).toBeGreaterThan(10)
        if (card.knowledge!.kind === 'shell' && example.expectedOutput === '' && example.exitStatus === undefined) {
          expect(example.interpretation, card.id).toMatch(/exit (code|status)/i)
        }
      }
    }
  })

  it('distinguishes iostat boot averages from interval samples', () => {
    const card = commandLibrary.find(item => item.id === 'iostat')!
    expect(card.knowledge!.verification).toBe('PENDING')
    expect(card.knowledge!.options.find(option => option.name === '-y')?.purpose).toContain('Bỏ báo cáo đầu')
    expect(card.knowledge!.examples[0].command).toBe('iostat -xz 1 5')
    expect(card.pitfalls).toContain('Báo cáo đầu là từ boot')
    expect(card.knowledge!.examples[1].command).toBe('iostat -yxz 1 3')
    expect(card.knowledge!.examples[1].interpretation).toContain('mẫu interval')
  })
})
