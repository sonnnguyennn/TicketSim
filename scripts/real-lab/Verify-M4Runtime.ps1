# Actual read-only TLS/process identity checks; returns no pairing/bridge secret.
$ErrorActionPreference='Stop'
$state='C:\ProgramData\TicketSimPilot'
$install='C:\Program Files\TicketSimPilot'
$release=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
if($release -notmatch '^C:\\Program Files\\TicketSimPilot\\releases\\[0-9a-f-]{36}$'){throw 'PROTECTED_RUNTIME_VERIFIER_REQUIRED'}
$identity=[Security.Principal.WindowsIdentity]::GetCurrent()
if(-not ([Security.Principal.WindowsPrincipal]$identity).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){throw 'OPERATOR_ELEVATION_REQUIRED'}
Import-Module (Join-Path $PSScriptRoot 'UpgradeProcess.psm1') -Force
$record=Get-M4InstallationRecord
if($record.releaseRoot -ine $release -or $record.operatorPrincipal -ine $identity.Name){throw 'OPERATOR_RELEASE_BINDING_MISMATCH'}
$runtime=Get-Content "$state\operator\control-runtime.json" -Raw|ConvertFrom-Json
$m1=Get-Content "$state\operator\m1-evidence.json" -Raw|ConvertFrom-Json
$preparation=Get-Content "$state\operator\preparation.json" -Raw|ConvertFrom-Json
foreach($item in @(
  @{Id=$runtime.pid;Exe="$release\node.exe";Script="$release\operator\bootstrap.mjs";Sid=$identity.User.Value;At=$runtime.startedAt;Window=60},
  @{Id=$m1.AgentNodePid;Exe="$install\node.exe";Script="$install\agent\pilot.mjs";Sid=$preparation.AgentSid;At=$m1.Runtime.startedAt;Window=30}
)){
  $process=Get-CimInstance Win32_Process -Filter "ProcessId=$($item.Id)" -ErrorAction Stop
  if(-not $process -or $process.ExecutablePath -ine $item.Exe -or [math]::Abs((([datetime]$process.CreationDate).ToUniversalTime()-([datetime]$item.At).ToUniversalTime()).TotalSeconds) -gt $item.Window){throw 'M4_PROCESS_IDENTITY_NOT_VERIFIED'}
  $arguments=@(ConvertFrom-WindowsCommandLine $process.CommandLine)
  if($arguments.Count -ne 2 -or $arguments[0] -ine $item.Exe -or $arguments[1] -ine $item.Script){throw 'M4_PROCESS_ARGUMENT_NOT_VERIFIED'}
  $owner=Invoke-CimMethod -InputObject $process -MethodName GetOwnerSid
  if($owner.ReturnValue -ne 0 -or $owner.Sid -ne $item.Sid){throw 'M4_PROCESS_OWNER_NOT_VERIFIED'}
}
[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
$operator=Invoke-WebRequest 'https://127.0.0.1:4176/' -UseBasicParsing -TimeoutSec 5
if($operator.StatusCode -ne 200 -or $operator.Content -notmatch 'TicketSim.*Operator'){throw 'M4_OPERATOR_TLS_NOT_VERIFIED'}
$agent=(Invoke-WebRequest 'https://127.0.0.1:4174/api/v1/status' -UseBasicParsing -TimeoutSec 5).Content|ConvertFrom-Json
if($agent.phase -ne 'terminal_only' -or $agent.actionsEnabled -ne $false -or $agent.secureTransport -ne $true){throw 'M4_LEARNER_NOT_TERMINAL_ONLY'}
[pscustomobject]@{TlsVerified=$true;AgentTerminalOnly=$true;OperatorControlVerified=$true;ControlPid=$runtime.pid;ControlSid=$identity.User.Value;CheckedAt=[datetime]::UtcNow.ToString('o')}|ConvertTo-Json -Compress
