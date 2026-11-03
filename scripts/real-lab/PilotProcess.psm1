function Select-PilotProcessTargets {
  param([Parameter(Mandatory)]$Record,[Parameter(Mandatory)][AllowEmptyCollection()][object[]]$Inventory,[Parameter(Mandatory)][string]$InstallRoot)
  # Console hosts and other Windows-managed children are not app processes.
  $candidates=@($Inventory|Where-Object {
    $_.ProcessId -in @($Record.OperatorPid,$Record.AgentLauncherPid) -or
    ($_.ParentProcessId -eq $Record.AgentLauncherPid -and $_.Name -eq 'node.exe')
  })
  foreach($process in $candidates){
    if($process.ExecutablePath -notin @("$InstallRoot\node.exe","$InstallRoot\powershell\pwsh.exe")){throw 'PROCESS_IDENTITY_MISMATCH'}
    if($process.CommandLine -notmatch 'agent[\\/]pilot\.mjs|operator[\\/]server\.mjs|Start-PilotRuntime\.ps1'){throw 'PROCESS_COMMAND_MISMATCH'}
  }
  return $candidates
}
Export-ModuleMember -Function Select-PilotProcessTargets
