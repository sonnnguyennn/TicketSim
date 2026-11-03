import { expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

it('selects only recorded pilot actors, excluding conhost and rejecting mismatched executables',()=>{
  const result=execFileSync('pwsh',['-NoProfile','-NonInteractive','-File',fileURLToPath(new URL('./real-lab/pilot-process.safety.ps1',import.meta.url))],{encoding:'utf8',windowsHide:true,timeout:15_000})
  expect(result.match(/PASS /g)).toHaveLength(4)
  expect(result).toContain('No process or VM operation was performed')
})
