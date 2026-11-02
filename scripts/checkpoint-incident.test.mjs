import { execFileSync } from 'node:child_process'
import { expect, it } from 'vitest'

it('reconciles only the exact checkpoint incident, preserving leases and journal on rejection', () => {
  const output=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-File','scripts/real-lab/checkpoint-incident.safety.ps1'],{encoding:'utf8'})
  expect(output).toContain('ASSERTIONS 17; zero real Hyper-V calls')
})
