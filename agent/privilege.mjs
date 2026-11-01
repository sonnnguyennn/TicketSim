import { execFileSync } from 'node:child_process'

/** Fails closed if the ordinary local agent starts with an elevated token. */
export function assertNonAdmin({ platform = process.platform, uid = process.getuid?.(), run = execFileSync } = {}) {
  if (platform === 'win32') {
    const command = '[Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)'
    const result = run('pwsh',['-NoProfile','-NonInteractive','-Command',command],{encoding:'utf8',timeout:5000,windowsHide:true}).trim()
    if (result !== 'False') throw new Error('LOCAL_AGENT_MUST_NOT_BE_ADMIN')
  } else if (uid === 0 || uid === undefined) throw new Error('LOCAL_AGENT_MUST_NOT_BE_ROOT')
}
