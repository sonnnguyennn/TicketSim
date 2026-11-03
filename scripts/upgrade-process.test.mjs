import { expect,it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

it('verifies upgrade process ownership/arguments and a mutation-free dry-run',()=>{
  const output=execFileSync('pwsh',['-NoProfile','-NonInteractive','-File',fileURLToPath(new URL('./real-lab/upgrade-process.safety.ps1',import.meta.url))],{encoding:'utf8',windowsHide:true,timeout:15_000})
  expect(output.match(/^PASS /gm)).toHaveLength(8)
  expect(output).toContain('PASS Record switch and actual installation-record assignment coexist')
  expect(output).toContain('No actual process, VM, state or backup operation was performed.')
},15_000)
