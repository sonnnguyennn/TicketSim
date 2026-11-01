import { execFileSync } from 'node:child_process'
import { expect, it } from 'vitest'

it('rejects unsafe B5 plans with synthetic collectors and no VM mutations', () => {
  const output=execFileSync('pwsh',['-NoProfile','-File','scripts/real-lab/fast-reset.safety.ps1'],{encoding:'utf8'})
  expect(output).toContain('PASS no Hyper-V mutation command called')
  expect(output.match(/^PASS /gm)).toHaveLength(10)
})
