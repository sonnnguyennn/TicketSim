import { expect,it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

it('isolates PowerShell 5/7 security modules and restores the parent environment',()=>{
  const output=execFileSync('pwsh',['-NoProfile','-NonInteractive','-File',fileURLToPath(new URL('./real-lab/pilot-shell.safety.ps1',import.meta.url))],{encoding:'utf8',windowsHide:true,timeout:20_000})
  expect(output.match(/^PASS /gm)).toHaveLength(4)
  expect(output).toContain('No credential prompt, live-runtime start/stop, journal or VM operation was performed.')
},20_000)
