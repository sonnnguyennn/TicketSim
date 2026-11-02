import { execFileSync } from 'node:child_process'
import { expect, it } from 'vitest'

it('reproduces the B5 GUID argument-mode bug and checks the real resolver filters on Windows PowerShell 5.1', () => {
  const output=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-File','scripts/real-lab/resolve-identity.safety.ps1'],{encoding:'utf8',timeout:30000})
  expect(output).toContain('PASS PS5.1 literal cast-token reproduces zero matches')
  expect(output.match(/^PASS /gm)).toHaveLength(7)
})
