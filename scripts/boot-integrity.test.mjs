import { expect,it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

it('accepts the legacy missing inventory entry while refusing changed or untrusted dependency bytes',()=>{
  const output=execFileSync('pwsh',['-NoProfile','-NonInteractive','-File',fileURLToPath(new URL('./real-lab/boot-integrity.safety.ps1',import.meta.url))],{encoding:'utf8',windowsHide:true,timeout:15_000})
  expect(output.match(/^PASS /gm)).toHaveLength(5)
  expect(output).toContain('No protected runtime, VM, backup or journal was changed.')
},15_000)
