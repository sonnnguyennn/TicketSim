# Read-only source diagnostic. No stage/manifest edit, gate release or retry.
$ErrorActionPreference='Stop'
if(-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){throw 'OPERATOR_ELEVATION_REQUIRED'}
$install='C:\Program Files\TicketSimPilot'
$state='C:\ProgramData\TicketSimPilot'
$preparation=Get-Content "$state\operator\preparation.json" -Raw|ConvertFrom-Json
if((Get-FileHash -LiteralPath "$install\node.exe" -Algorithm SHA256).Hash -ne $preparation.CodeHashes.'node.exe'){throw 'ORIGINAL_NODE_HASH_CHANGED'}
foreach($name in @('NODE_OPTIONS','NODE_PATH')){[Environment]::SetEnvironmentVariable($name,$null,'Process')}
$env:TICKETSIM_PWSH="$install\powershell\pwsh.exe"
$env:PSModulePath="$install\powershell\Modules;$env:WINDIR\System32\WindowsPowerShell\v1.0\Modules;$env:ProgramFiles\WindowsPowerShell\Modules"
& "$install\node.exe" (Join-Path $PSScriptRoot 'inspect-upgrade-failure.mjs')
if($LASTEXITCODE -ne 0){throw 'READONLY_UPGRADE_DIAGNOSTIC_FAILED'}
