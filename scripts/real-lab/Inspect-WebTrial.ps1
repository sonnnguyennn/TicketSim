# Read-only report. Does not reconcile or release any lease and never retries reset.
$ErrorActionPreference='Stop'
if(-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){throw 'OPERATOR_ELEVATION_REQUIRED'}
$install='C:\Program Files\TicketSimPilot'
$env:TICKETSIM_PWSH="$install\powershell\pwsh.exe"
$env:PSModulePath="$install\powershell\Modules;$env:WINDIR\System32\WindowsPowerShell\v1.0\Modules;$env:ProgramFiles\WindowsPowerShell\Modules"
[Environment]::SetEnvironmentVariable('NODE_OPTIONS',$null,'Process')
[Environment]::SetEnvironmentVariable('NODE_PATH',$null,'Process')
& "$install\node.exe" "$install\agent\trialReport.mjs"
if($LASTEXITCODE -ne 0){throw 'READONLY_TRIAL_REPORT_FAILED'}
