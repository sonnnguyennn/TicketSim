$ErrorActionPreference='Stop'
Import-Module (Join-Path $PSScriptRoot 'PilotProcess.psm1') -Force
$root='C:\Program Files\TicketSimPilot'
$record=[pscustomobject]@{OperatorPid=100;AgentLauncherPid=200}
$inventory=@(
  [pscustomobject]@{ProcessId=100;ParentProcessId=1;Name='node.exe';ExecutablePath="$root\node.exe";CommandLine="$root\node.exe $root\operator\server.mjs"},
  [pscustomobject]@{ProcessId=200;ParentProcessId=1;Name='pwsh.exe';ExecutablePath="$root\powershell\pwsh.exe";CommandLine="$root\powershell\pwsh.exe -File $root\scripts\real-lab\Start-PilotRuntime.ps1 -Role Agent"},
  [pscustomobject]@{ProcessId=300;ParentProcessId=200;Name='conhost.exe';ExecutablePath='C:\Windows\System32\conhost.exe';CommandLine='console host'},
  [pscustomobject]@{ProcessId=400;ParentProcessId=200;Name='node.exe';ExecutablePath="$root\node.exe";CommandLine="$root\node.exe $root\agent\pilot.mjs"},
  [pscustomobject]@{ProcessId=500;ParentProcessId=1;Name='node.exe';ExecutablePath='C:\unrelated\node.exe';CommandLine='other work'}
)
$targets=@(Select-PilotProcessTargets -Record $record -Inventory $inventory -InstallRoot $root)
if(($targets.ProcessId|Sort-Object)-join ',' -ne '100,200,400'){throw 'TARGET_SELECTION_FAILED'}
Write-Output 'PASS excludes Windows console host and unrelated processes'
$missing=@(Select-PilotProcessTargets -Record $record -Inventory @($inventory|Where-Object {$_.ProcessId -notin @(200,400)}) -InstallRoot $root)
if($missing.Count -ne 1 -or $missing[0].ProcessId -ne 100){throw 'EXPECTED_EXIT_NOT_HANDLED'}
Write-Output 'PASS permits already-exited Agent/launcher in a repeated inventory'
$wrong=@($inventory|ForEach-Object{if($_.ProcessId -eq 100){[pscustomobject]@{ProcessId=100;ParentProcessId=1;Name='node.exe';ExecutablePath='C:\unrelated\node.exe';CommandLine='other'}}else{$_}})
try{Select-PilotProcessTargets -Record $record -Inventory $wrong -InstallRoot $root|Out-Null;throw 'EXPECTED_REJECTION'}catch{if($_.Exception.Message -notlike '*PROCESS_IDENTITY_MISMATCH*'){throw}}
Write-Output 'PASS blocks a reused recorded PID with another executable'
$wrongChild=@($inventory|ForEach-Object{if($_.ProcessId -eq 400){[pscustomobject]@{ProcessId=400;ParentProcessId=200;Name='node.exe';ExecutablePath='C:\unrelated\node.exe';CommandLine='other'}}else{$_}})
try{Select-PilotProcessTargets -Record $record -Inventory $wrongChild -InstallRoot $root|Out-Null;throw 'EXPECTED_REJECTION'}catch{if($_.Exception.Message -notlike '*PROCESS_IDENTITY_MISMATCH*'){throw}}
Write-Output 'PASS blocks an untrusted Node child'
Write-Output 'No process or VM operation was performed by this harness.'
