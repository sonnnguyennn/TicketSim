param([switch]$Apply)
$ErrorActionPreference='Stop'
$install='C:\Program Files\TicketSimPilot'
$state='C:\ProgramData\TicketSimPilot'
$repo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
if(-not $Apply){
  [pscustomobject]@{Apply=$false;Changes='Stage immutable Operator release; verify actual completed M3; retain maintenance gate; stop exact recorded pilot processes; launch separate Operator consent page; restart original learner runtime terminal-only; verify TLS/identities/history before release. No guest setup, fault, reset, checkpoint or backup mutation.';Install=$install;State=$state}|ConvertTo-Json
  return
}
$identity=[Security.Principal.WindowsIdentity]::GetCurrent()
if(-not ([Security.Principal.WindowsPrincipal]$identity).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){throw 'OPERATOR_ELEVATION_REQUIRED'}
if(Test-Path "$state\operator\m4-upgrade.json"){throw 'UPGRADE_RECORD_EXISTS_DO_NOT_RETRY'}
if(Test-Path 'E:\TicketSimOperatorState\b5\exclusive-lease'){throw 'B5_LEASE_HELD'}
foreach($name in @('NODE_OPTIONS','NODE_PATH')){[Environment]::SetEnvironmentVariable($name,$null,'Process')}
$preparation=Get-Content "$state\operator\preparation.json" -Raw|ConvertFrom-Json
if($preparation.Operator -ine $identity.Name -or -not $preparation.CodeHashes){throw 'ORIGINAL_PREPARATION_NOT_VERIFIED'}
foreach($property in $preparation.CodeHashes.PSObject.Properties){
  if((Get-FileHash -LiteralPath (Join-Path $install $property.Name) -Algorithm SHA256).Hash -ne $property.Value){throw 'ORIGINAL_PROTECTED_CODE_CHANGED'}
}
if((Get-FileHash -LiteralPath "$repo\package-lock.json" -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath "$install\package-lock.json" -Algorithm SHA256).Hash){throw 'DEPENDENCY_LOCK_CHANGED_REQUIRES_PACKAGE_QUALIFICATION'}
foreach($path in @($install,$repo)){
  if((Get-Item -LiteralPath $path).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'RUNTIME_ROOT_REDIRECTED'}
}
$payloadBytes=0
foreach($path in @("$repo\agent","$repo\operator","$repo\scripts\real-lab","$repo\src\real-lab","$install\powershell","$install\node_modules")){
  $payloadBytes+=(Get-ChildItem -LiteralPath $path -Recurse -Force -File|Measure-Object -Property Length -Sum).Sum
}
$payloadBytes+=(Get-Item -LiteralPath "$install\node.exe").Length
if(([IO.DriveInfo]'C:\').AvailableFreeSpace -lt (12GB+$payloadBytes+256MB) -or ([IO.DriveInfo]'E:\').AvailableFreeSpace -lt 15GB -or ((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory*1KB) -lt 1GB){throw 'UPGRADE_RESOURCE_MINIMUM_FAILED'}
$release=Join-Path "$install\releases" ([guid]::NewGuid().ToString())
if((Test-Path "$install\releases") -and ((Get-Item -LiteralPath "$install\releases").Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'RELEASE_PARENT_REDIRECTED'}
$null=New-Item -ItemType Directory -Path $release
# Inherit the existing protected ACL: only Administrators/SYSTEM can write.
foreach($name in @('agent','operator','scripts\real-lab','src\real-lab')){
  $source=Join-Path $repo $name
  if((Get-Item -LiteralPath $source).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'SOURCE_ROOT_LINK_FORBIDDEN'}
  if(@(Get-ChildItem -LiteralPath $source -Recurse -Force | Where-Object {$_.Attributes -band [IO.FileAttributes]::ReparsePoint}).Count){throw 'SOURCE_LINK_FORBIDDEN'}
  & robocopy.exe $source (Join-Path $release $name) /E /COPY:DAT /DCOPY:DAT /XF *.test.mjs *.safety.ps1 /NFL /NDL /NJH /NJS /NP | Out-Null
  if($LASTEXITCODE -ge 8){throw 'OPERATOR_RELEASE_COPY_FAILED'}
}
foreach($name in @('powershell','node_modules')){
  $source=Join-Path $install $name
  if((Get-Item -LiteralPath $source).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'PROTECTED_DEPENDENCY_ROOT_LINK_FORBIDDEN'}
  if(@(Get-ChildItem -LiteralPath $source -Recurse -Force | Where-Object {$_.Attributes -band [IO.FileAttributes]::ReparsePoint}).Count){throw 'PROTECTED_DEPENDENCY_LINK_FORBIDDEN'}
  & robocopy.exe $source (Join-Path $release $name) /E /COPY:DAT /DCOPY:DAT /NFL /NDL /NJH /NJS /NP | Out-Null
  if($LASTEXITCODE -ge 8){throw 'PROTECTED_DEPENDENCY_COPY_FAILED'}
}
Copy-Item -LiteralPath "$install\node.exe" -Destination "$release\node.exe"
Copy-Item -LiteralPath "$repo\package.json","$repo\package-lock.json" -Destination $release
if(@(Get-ChildItem -LiteralPath $release -Recurse -Force|Where-Object {$_.Attributes -band [IO.FileAttributes]::ReparsePoint}).Count){throw 'RELEASE_LINK_FORBIDDEN'}
$files=@(Get-ChildItem -LiteralPath $release -Recurse -Force -File|Sort-Object FullName|ForEach-Object{[pscustomobject]@{path=$_.FullName.Substring($release.Length+1).Replace('\','/');sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()}})
[IO.File]::WriteAllText("$release\release-manifest.json",([pscustomobject]@{schemaVersion=1;files=$files}|ConvertTo-Json -Depth 5),(New-Object Text.UTF8Encoding($false)))
$digest=(Get-FileHash -LiteralPath "$release\release-manifest.json" -Algorithm SHA256).Hash.ToLowerInvariant()
$env:TICKETSIM_PWSH="$release\powershell\pwsh.exe"
$env:PSModulePath="$release\powershell\Modules;$env:WINDIR\System32\WindowsPowerShell\v1.0\Modules;$env:ProgramFiles\WindowsPowerShell\Modules"
function Invoke-UpgradeStage([string]$Stage,[string]$Digest=''){
  $arguments=@("$release\operator\upgrade.mjs",$Stage)
  if($Digest){$arguments+=$Digest}
  $output=& "$release\node.exe" @arguments
  if($LASTEXITCODE -ne 0){throw 'UPGRADE_STAGE_FAILED_GATE_RETAINED_DO_NOT_RETRY'}
  $output|ConvertFrom-Json
}
$null=Invoke-UpgradeStage 'begin' $digest
Import-Module "$release\scripts\real-lab\UpgradeProcess.psm1" -Force
$record=Get-Content "$state\operator\m4-previous-processes.json" -Raw|ConvertFrom-Json
$m1=Get-Content "$state\operator\m4-previous-m1.json" -Raw|ConvertFrom-Json
$targets=@()
foreach($item in @(@{Role='Agent';Id=$m1.AgentNodePid},@{Role='Launcher';Id=$record.AgentLauncherPid},@{Role='Operator';Id=$record.OperatorPid})){
  $process=Get-CimInstance Win32_Process -Filter "ProcessId=$($item.Id)" -ErrorAction Stop
  if(-not $process){throw 'EXPECTED_LEGACY_PROCESS_MISSING_GATE_RETAINED'}
  if($process.ProcessId -eq $PID){throw 'REFUSE_TO_STOP_CURRENT_OPERATOR'}
  $owner=Invoke-CimMethod -InputObject $process -MethodName GetOwnerSid
  if($owner.ReturnValue -ne 0){throw 'PROCESS_OWNER_NOT_VERIFIED'}
  $arguments=@(ConvertFrom-WindowsCommandLine $process.CommandLine)
  Assert-UpgradeProcessIdentity -Process $process -Arguments $arguments -Role $item.Role -Record $record -M1 $m1 -AgentSid $preparation.AgentSid -OperatorSid $identity.User.Value -OwnerSid $owner.Sid
  $targets+=,$process
}
# Every candidate was validated before stopping anything. Recheck each PID at use.
foreach($process in $targets){
  $current=Get-CimInstance Win32_Process -Filter "ProcessId=$($process.ProcessId)" -ErrorAction Stop
  if(-not $current){continue}
  $handleProcess=[Diagnostics.Process]::GetProcessById($process.ProcessId)
  try{
    $null=$handleProcess.Handle
    $current=Get-CimInstance Win32_Process -Filter "ProcessId=$($process.ProcessId)" -ErrorAction Stop
    if(-not $current -or $current.CreationDate -ne $process.CreationDate -or $current.ExecutablePath -ne $process.ExecutablePath -or $current.CommandLine -ne $process.CommandLine){throw 'PROCESS_ID_REUSED_GATE_RETAINED'}
    # Stop through the captured process object/handle, not a later PID lookup.
    Microsoft.PowerShell.Management\Stop-Process -InputObject $handleProcess -Confirm:$false -ErrorAction Stop
    if(-not $handleProcess.WaitForExit(10000)){throw 'PROCESS_STOP_UNKNOWN_GATE_RETAINED'}
  }finally{$handleProcess.Dispose()}
}
foreach($port in @(4174,4175,4176)){
  if(@(Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue).Count){throw 'RUNTIME_PORT_STILL_HELD_GATE_RETAINED'}
}
$null=Invoke-UpgradeStage 'retired'
# Reuse the already-qualified learner runtime unchanged; Start in TerminalOnly
# cannot arm another M3 permit. Credential is entered locally, never in chat.
& "$install\scripts\real-lab\Start-PilotRuntime.ps1" -Mode TerminalOnly
if(-not $?){throw 'LEARNER_RESTART_FAILED_GATE_RETAINED'}
$control=Start-Process -FilePath "$release\node.exe" -WorkingDirectory $release -ArgumentList @("`"$release\operator\bootstrap.mjs`"") -WindowStyle Hidden -PassThru -RedirectStandardOutput "$state\operator\control.stdout.log" -RedirectStandardError "$state\operator\control.stderr.log"
[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
$response=$null;$deadline=[datetime]::UtcNow.AddSeconds(60)
while([datetime]::UtcNow -lt $deadline){
  try{$response=Invoke-WebRequest 'https://127.0.0.1:4176/' -UseBasicParsing -TimeoutSec 2;break}catch{}
  if($control.HasExited){throw 'OPERATOR_BOOTSTRAP_FAILED_GATE_RETAINED'}
  Start-Sleep -Milliseconds 200
}
if($response.StatusCode -ne 200 -or $response.Content -notmatch 'TicketSim.*Operator'){throw 'OPERATOR_TLS_READINESS_FAILED_GATE_RETAINED'}
$agentStatus=(Invoke-WebRequest 'https://127.0.0.1:4174/api/v1/status' -UseBasicParsing -TimeoutSec 5).Content|ConvertFrom-Json
if($agentStatus.phase -ne 'terminal_only' -or $agentStatus.actionsEnabled -ne $false -or -not $agentStatus.secureTransport){throw 'LEARNER_NOT_TERMINAL_ONLY_GATE_RETAINED'}
$runtime=Get-Content "$state\operator\control-runtime.json" -Raw|ConvertFrom-Json
$process=Get-CimInstance Win32_Process -Filter "ProcessId=$($runtime.pid)"
if(-not $process -or $runtime.pid -ne $control.Id -or $process.ExecutablePath -ine "$release\node.exe"){throw 'OPERATOR_CONTROL_PROCESS_MISMATCH'}
$owner=Invoke-CimMethod -InputObject $process -MethodName GetOwnerSid
if($owner.ReturnValue -ne 0 -or $owner.Sid -ne $identity.User.Value -or $runtime.sid -ne $identity.User.Value){throw 'OPERATOR_CONTROL_OWNER_MISMATCH'}
[pscustomobject]@{TlsVerified=$true;AgentTerminalOnly=$true;OperatorControlVerified=$true;ControlPid=$control.Id;ControlSid=$owner.Sid;CheckedAt=[datetime]::UtcNow.ToString('o')}|ConvertTo-Json|Set-Content "$state\operator\m4-readiness.json"
$result=Invoke-UpgradeStage 'complete'
& "$release\scripts\real-lab\Open-Operator.ps1"
Write-Output 'Upgrade completed: protected Operator consent page and terminal-only learner runtime. M3 history/permit preserved; zero new VM operations and zero qualified new scenarios.'
