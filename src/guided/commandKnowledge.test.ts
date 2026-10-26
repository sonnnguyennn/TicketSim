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
})
