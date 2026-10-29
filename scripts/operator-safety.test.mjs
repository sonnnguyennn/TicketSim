import { execFileSync } from 'node:child_process'
import { expect, it } from 'vitest'
it('runs isolated PowerShell provisioning safety checks without Hyper-V mutations', () => {
  const output = execFileSync('pwsh', ['-NoProfile', '-File', 'scripts/real-lab/operator.safety.ps1'], { encoding: 'utf8', timeout: 30000 })
  expect(output).toContain('PASS zero Hyper-V mutations')
  expect(output.match(/^PASS /gm)).toHaveLength(24)
})
