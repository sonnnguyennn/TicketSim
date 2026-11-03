import { execFileSync } from 'node:child_process'

/** Fails closed if the ordinary local agent starts with an elevated token. */
export function assertNonAdmin({ platform = process.platform, uid = process.getuid?.(), run = execFileSync } = {}) {
  if (platform === 'win32') {
    const command = '[Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)'
    const result = run('pwsh',['-NoProfile','-NonInteractive','-Command',command],{encoding:'utf8',timeout:5000,windowsHide:true}).trim()
    if (result !== 'False') throw new Error('LOCAL_AGENT_MUST_NOT_BE_ADMIN')
  } else if (uid === 0 || uid === undefined) throw new Error('LOCAL_AGENT_MUST_NOT_BE_ROOT')
}

/** Check the actual token, account memberships and effective Hyper-V read access. No mutations. */
export function assertPilotIsolation({ run = execFileSync, pwsh = 'pwsh' } = {}) {
  if (process.platform !== 'win32') throw new Error('PILOT_REQUIRES_WINDOWS_ISOLATION_EVIDENCE')
  const command = `$ErrorActionPreference='Stop'; $i=[Security.Principal.WindowsIdentity]::GetCurrent(); $g=@($i.Groups | ForEach-Object Value); $priv=($g -contains 'S-1-5-32-544') -or ($g -contains 'S-1-5-32-578'); $null=Get-Command Get-VM -ErrorAction Stop; $read=$null; try { $null=Get-VM -Id '2b9c2170-9a23-4d08-b82e-29929afa4c10' -ErrorAction Stop; $read=$true } catch { if($_.CategoryInfo.Category -eq 'PermissionDenied' -or $_.Exception.Message -match 'required permission|Access is denied|Access denied|not authorized') {$read=$false} }; [pscustomobject]@{principal=$i.Name; privileged=$priv; hypervReadable=$read} | ConvertTo-Json -Compress`
  const result = JSON.parse(run(pwsh, ['-NoProfile','-NonInteractive','-Command',command], {encoding:'utf8',timeout:15_000,windowsHide:true}))
  if (result.privileged !== false || result.hypervReadable !== false || !/\\TicketSimAgent$/i.test(result.principal)) throw new Error('PILOT_AGENT_PRIVILEGE_ISOLATION_FAILED')
  return result
}
