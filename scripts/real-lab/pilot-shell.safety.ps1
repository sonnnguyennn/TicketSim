param([switch]$ChildCheck,[switch]$ForeignCheck,[switch]$FailChild,[string]$ForeignModules)
$ErrorActionPreference='Stop'
if($FailChild){exit 17}
if($ForeignCheck){
  $env:PSModulePath=$ForeignModules
  $rejected=$false
  try{Import-Module Microsoft.PowerShell.Security -ErrorAction Stop}catch{$rejected=$true}
  [pscustomobject]@{ForeignRejected=$rejected;Major=$PSVersionTable.PSVersion.Major}|ConvertTo-Json -Compress
  return
}
if($ChildCheck){
  Import-Module Microsoft.PowerShell.Security -ErrorAction Stop
  $command=Get-Command Get-Credential -ErrorAction Stop
  if(-not $command.Module.Path.StartsWith((Join-Path $PSHOME 'Modules'),[StringComparison]::OrdinalIgnoreCase)){throw 'SECURITY_MODULE_HOST_MISMATCH'}
  [pscustomobject]@{Major=$PSVersionTable.PSVersion.Major;CredentialCommandAvailable=$true}|ConvertTo-Json -Compress
  return
}
Import-Module (Join-Path $PSScriptRoot 'PilotShell.psm1') -Force
$ps7=(Get-Process -Id $PID).Path
$ps5=Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
$before=$env:PSModulePath
$seven=Invoke-PilotPowerShell -Executable $ps7 -Script $PSCommandPath -ScriptArguments @('-ChildCheck')|ConvertFrom-Json
if($seven.Major -lt 7 -or -not $seven.CredentialCommandAvailable){throw 'PS7_MODULE_TEST_FAILED'}
Write-Output 'PASS PowerShell 7 credential module loads in matching host'
$five=Invoke-PilotPowerShell -Executable $ps5 -Script $PSCommandPath -ScriptArguments @('-ChildCheck')|ConvertFrom-Json
if($five.Major -ne 5 -or -not $five.CredentialCommandAvailable){throw 'PS5_MODULE_TEST_FAILED'}
Write-Output 'PASS Windows PowerShell 5 credential module loads in matching host'
$foreign=Invoke-PilotPowerShell -Executable $ps5 -Script $PSCommandPath -ScriptArguments @('-ForeignCheck','-ForeignModules',(Join-Path (Split-Path $ps7) 'Modules'))|ConvertFrom-Json
if(-not $foreign.ForeignRejected){throw 'Expected incompatible PS7 module rejection in PS5'}
Write-Output 'PASS original cross-version module failure reproduced without prompting credentials'
$failed=$false
try{Invoke-PilotPowerShell -Executable $ps7 -Script $PSCommandPath -ScriptArguments @('-FailChild')}catch{if($_.Exception.Message -ne 'PILOT_CHILD_HOST_FAILED_EXIT_17'){throw};$failed=$true}
if(-not $failed -or $env:PSModulePath -cne $before){throw 'CHILD_FAILURE_ENVIRONMENT_NOT_RESTORED'}
Write-Output 'PASS caller environment restored after child failure'
$missingRejected=$false
try{Invoke-PilotPowerShell -Executable (Join-Path $PSScriptRoot 'nonexistent-pilot-host.exe') -Script $PSCommandPath}catch{$missingRejected=$true}
if(-not $missingRejected -or $env:PSModulePath -cne $before){throw 'MISSING_CHILD_HOST_NOT_REJECTED'}
Write-Output 'PASS missing child executable fails closed and restores caller environment'
Write-Output 'No credential prompt, live-runtime start/stop, journal or VM operation was performed.'
