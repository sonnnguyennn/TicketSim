# Development refresh only; never a recovery or lease-reconciliation operation.
$ErrorActionPreference='Stop'
$install='C:\Program Files\TicketSimPilot'
$state='C:\ProgramData\TicketSimPilot'
if(-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){throw 'OPERATOR_ELEVATION_REQUIRED'}
$record=Get-Content "$state\operator\processes.json" -Raw | ConvertFrom-Json
if($record.Mode -ne 'terminal-only'){throw 'ONLY_TERMINAL_ONLY_PROCESSES_MAY_BE_STOPPED_BY_THIS_HELPER'}
if(Test-Path "$state\agent\runs.sqlite"){
  $json=& "$install\node.exe" "$install\scripts\real-lab\inspect-leases.mjs" "$state\agent\runs.sqlite"
  if($LASTEXITCODE -ne 0){throw 'LEASE_UNKNOWN'}
  $leases=$json|ConvertFrom-Json
  if(-not $leases.clear -or @($leases.runs|Where-Object {$_.phase -ne 'completed'}).Count){throw 'ACTIVE_OR_QUARANTINED_RUN: do not stop or refresh'}
}
$all=@(Get-CimInstance Win32_Process)
$candidates=@($all|Where-Object {$_.ProcessId -in @($record.OperatorPid,$record.AgentLauncherPid) -or $_.ParentProcessId -eq $record.AgentLauncherPid})
foreach($process in $candidates){
  if($process.ProcessId -eq $PID){throw 'REFUSE_TO_STOP_CURRENT_OPERATOR'}
  if($process.ExecutablePath -notin @("$install\node.exe","$install\powershell\pwsh.exe")){throw 'PROCESS_IDENTITY_MISMATCH'}
  if($process.CommandLine -notmatch 'agent[\\/]pilot\.mjs|operator[\\/]server\.mjs|Start-PilotRuntime\.ps1'){throw 'PROCESS_COMMAND_MISMATCH'}
}
foreach($process in ($candidates|Sort-Object ParentProcessId -Descending)){Stop-Process -Id $process.ProcessId -ErrorAction Stop}
Write-Output 'Stopped only the recorded terminal-only pilot processes. No VM action, database edit, journal edit or lease release.'
