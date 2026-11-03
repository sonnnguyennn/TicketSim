param([switch]$Apply)
$ErrorActionPreference='Stop'
if(-not $Apply){
  [pscustomobject]@{Apply=$false;Changes='Continue only the verified retired upgrade: start missing terminal-only learner in protected PowerShell 7, start Operator, verify, complete. No staging, process stop, VM mutation or gate reacquisition.'}|ConvertTo-Json
  return
}
Import-Module (Join-Path $PSScriptRoot 'PilotShell.psm1') -Force
Set-PilotCallerModulePath
$identity=[Security.Principal.WindowsIdentity]::GetCurrent()
if(-not ([Security.Principal.WindowsPrincipal]$identity).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){throw 'OPERATOR_ELEVATION_REQUIRED'}
$state='C:\ProgramData\TicketSimPilot'
$install='C:\Program Files\TicketSimPilot'
Import-Module (Join-Path $PSScriptRoot 'UpgradeProcess.psm1') -Force
$record=Get-M4InstallationRecord
$release=[IO.Path]::GetFullPath($record.releaseRoot)
if($record.phase -ne 'retired' -or $record.operatorPrincipal -ine $identity.Name -or $release -notmatch '^C:\\Program Files\\TicketSimPilot\\releases\\[0-9a-f-]{36}$'){throw 'RETIRED_UPGRADE_REQUIRED'}
$preparation=Get-Content "$state\operator\preparation.json" -Raw|ConvertFrom-Json
foreach($name in @('node.exe','powershell\pwsh.exe','scripts\real-lab\Start-PilotRuntime.ps1')){
  if((Get-FileHash -LiteralPath (Join-Path $install $name) -Algorithm SHA256).Hash -ne $preparation.CodeHashes.$name){throw 'QUALIFIED_LAUNCHER_HASH_CHANGED'}
}
foreach($name in @('NODE_OPTIONS','NODE_PATH')){[Environment]::SetEnvironmentVariable($name,$null,'Process')}
$evidence=& "$install\node.exe" (Join-Path $PSScriptRoot 'inspect-retired-upgrade.mjs')
if($LASTEXITCODE -ne 0){throw 'RETIRED_STATE_NOT_VERIFIED_NO_START'}
$eligible=$evidence|ConvertFrom-Json
if($eligible.eligible -ne $true -or $eligible.ownerId -ne $record.ownerId -or $eligible.releaseRoot -ine $release){throw 'RETIRED_BINDING_MISMATCH'}
if(@(Get-CimInstance Win32_Process|Where-Object {$_.ExecutablePath -in @("$install\node.exe","$release\node.exe")}).Count){throw 'RUNTIME_ALREADY_PRESENT_DO_NOT_DUPLICATE'}
foreach($port in @(4174,4175,4176)){if(@(Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue).Count){throw 'RUNTIME_PORT_ALREADY_HELD_NO_START'}}
$progress=[ordered]@{phase='starting_learner';ownerId=$record.ownerId;releaseRoot=$release;startedAt=[datetime]::UtcNow.ToString('o')}
$marker="$state\operator\m4-retired-continuation.json"
$stream=[IO.File]::Open($marker,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::Read)
try{$bytes=[Text.Encoding]::UTF8.GetBytes(($progress|ConvertTo-Json));$stream.Write($bytes,0,$bytes.Length)}finally{$stream.Dispose()}
try{
  Invoke-PilotPowerShell -Script "$install\scripts\real-lab\Start-PilotRuntime.ps1" -ScriptArguments @('-Mode','TerminalOnly') -Interactive
  $progress.phase='starting_operator';$progress|ConvertTo-Json|Set-Content -LiteralPath $marker
  $control=Start-Process -FilePath "$release\node.exe" -WorkingDirectory $release -ArgumentList @("`"$release\operator\bootstrap.mjs`"") -WindowStyle Hidden -PassThru -RedirectStandardOutput "$state\operator\control.stdout.log" -RedirectStandardError "$state\operator\control.stderr.log"
  [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
  $response=$null;$deadline=[datetime]::UtcNow.AddSeconds(60)
  while([datetime]::UtcNow -lt $deadline){
    try{$response=Invoke-WebRequest 'https://127.0.0.1:4176/' -UseBasicParsing -TimeoutSec 2;break}catch{}
    if($control.HasExited){throw 'OPERATOR_BOOTSTRAP_FAILED_GATE_RETAINED'}
    Start-Sleep -Milliseconds 200
  }
  if(-not $response -or $response.StatusCode -ne 200 -or $response.Content -notmatch 'TicketSim.*Operator'){throw 'OPERATOR_TLS_READINESS_FAILED_GATE_RETAINED'}
  $runtime=Get-Content "$state\operator\control-runtime.json" -Raw|ConvertFrom-Json
  if($runtime.pid -ne $control.Id){throw 'OPERATOR_START_IDENTITY_MISMATCH'}
  $progress.phase='verifying_installation';$progress|ConvertTo-Json|Set-Content -LiteralPath $marker
  $result=& "$release\node.exe" "$release\operator\upgrade.mjs" complete
  if($LASTEXITCODE -ne 0){throw 'UPGRADE_COMPLETION_FAILED_GATE_RETAINED'}
  $completed=$result|ConvertFrom-Json
  if($completed.phase -ne 'installed' -or $completed.ownerId -ne $record.ownerId -or $completed.releaseRoot -ine $release){throw 'UPGRADE_COMPLETION_RESPONSE_INVALID'}
  $progress.phase='completed';$progress['completedAt']=[datetime]::UtcNow.ToString('o');$progress|ConvertTo-Json|Set-Content -LiteralPath $marker
  Invoke-PilotPowerShell -Script "$release\scripts\real-lab\Open-Operator.ps1"
  Write-Output 'Retired upgrade completed. Learner terminal-only, Operator consent page ready, M3 preserved. No process stop or VM-changing operation performed.'
}catch{
  if($progress.phase -ne 'completed'){$progress['failedStage']=$progress.phase;$progress.phase='failed';$progress|ConvertTo-Json|Set-Content -LiteralPath $marker}
  throw
}
