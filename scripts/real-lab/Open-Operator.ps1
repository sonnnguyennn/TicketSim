$ErrorActionPreference='Stop'
$state='C:\ProgramData\TicketSimPilot'
$identity=[Security.Principal.WindowsIdentity]::GetCurrent()
if(-not ([Security.Principal.WindowsPrincipal]$identity).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){throw 'OPERATOR_ELEVATION_REQUIRED'}
Import-Module (Join-Path $PSScriptRoot 'UpgradeProcess.psm1') -Force
$record=Get-M4InstallationRecord
$release=[IO.Path]::GetFullPath($record.releaseRoot)
if($record.phase -ne 'installed' -or $record.operatorPrincipal -ine $identity.Name -or $release -notmatch '^C:\\Program Files\\TicketSimPilot\\releases\\[0-9a-f-]{36}$'){throw 'VERIFIED_OPERATOR_INSTALLATION_REQUIRED'}
if((Get-FileHash -LiteralPath "$release\release-manifest.json" -Algorithm SHA256).Hash.ToLowerInvariant() -cne $record.manifestSha256){throw 'RELEASE_MANIFEST_CHANGED'}
$manifest=Get-Content "$release\release-manifest.json" -Raw|ConvertFrom-Json
foreach($name in @('node.exe','scripts/real-lab/Verify-OperatorRelease.mjs','operator/bootstrapPolicy.mjs')){
  $entry=@($manifest.files|Where-Object {$_.path -ceq $name})
  if($entry.Count -ne 1 -or (Get-FileHash -LiteralPath (Join-Path $release $name) -Algorithm SHA256).Hash.ToLowerInvariant() -cne $entry[0].sha256){throw 'RELEASE_VERIFIER_CHANGED'}
}
foreach($name in @('NODE_OPTIONS','NODE_PATH')){[Environment]::SetEnvironmentVariable($name,$null,'Process')}
$null=& "$release\node.exe" "$release\scripts\real-lab\Verify-OperatorRelease.mjs" $record.manifestSha256
if($LASTEXITCODE -ne 0){throw 'RELEASE_INTEGRITY_NOT_VERIFIED'}
$env:TICKETSIM_PWSH='C:\Program Files\TicketSimPilot\powershell\pwsh.exe'
$env:PSModulePath="C:\Program Files\TicketSimPilot\powershell\Modules;$env:WINDIR\System32\WindowsPowerShell\v1.0\Modules;$env:ProgramFiles\WindowsPowerShell\Modules"
$runtime=if(Test-Path "$state\operator\control-runtime.json"){Get-Content "$state\operator\control-runtime.json" -Raw|ConvertFrom-Json}else{$null}
$process=if($runtime){Get-CimInstance Win32_Process -Filter "ProcessId=$($runtime.pid)"}else{$null}
if(-not $process){
  if(@(Get-NetTCPConnection -State Listen -LocalPort 4176 -ErrorAction SilentlyContinue).Count){throw 'OPERATOR_PORT_HELD_BY_UNKNOWN_PROCESS'}
  $child=Start-Process -FilePath "$release\node.exe" -WorkingDirectory $release -ArgumentList @("`"$release\operator\bootstrap.mjs`"") -WindowStyle Hidden -PassThru -RedirectStandardOutput "$state\operator\control.stdout.log" -RedirectStandardError "$state\operator\control.stderr.log"
  $deadline=[datetime]::UtcNow.AddSeconds(60)
  do{
    Start-Sleep -Milliseconds 200
    if($child.HasExited){throw 'OPERATOR_BOOTSTRAP_FAILED'}
    $runtime=if(Test-Path "$state\operator\control-runtime.json"){Get-Content "$state\operator\control-runtime.json" -Raw|ConvertFrom-Json}else{$null}
  }while(( -not $runtime -or $runtime.pid -ne $child.Id) -and [datetime]::UtcNow -lt $deadline)
  if(-not $runtime -or $runtime.pid -ne $child.Id){throw 'OPERATOR_START_RESULT_UNKNOWN'}
  $process=Get-CimInstance Win32_Process -Filter "ProcessId=$($runtime.pid)"
}
if(-not $process -or $process.ExecutablePath -ine "$release\node.exe" -or $runtime.releaseRoot -ine $release -or [math]::Abs((([datetime]$process.CreationDate).ToUniversalTime()-([datetime]$runtime.startedAt).ToUniversalTime()).TotalSeconds) -gt 60){throw 'OPERATOR_PROCESS_IDENTITY_MISMATCH'}
$owner=Invoke-CimMethod -InputObject $process -MethodName GetOwnerSid
if($owner.ReturnValue -ne 0 -or $owner.Sid -ne $identity.User.Value -or $runtime.sid -ne $identity.User.Value){throw 'OPERATOR_PROCESS_OWNER_MISMATCH'}
[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
$link=$null
try{
  $null=Invoke-WebRequest 'https://127.0.0.1:4176/api/operator/reissue' -Method Post -ContentType 'application/json' -Body '{}' -Headers @{Origin='https://127.0.0.1:4176';Authorization=('Bearer '+[IO.File]::ReadAllText("$state\operator\control-reopen-token").Trim())} -UseBasicParsing -TimeoutSec 5
  $link=[IO.File]::ReadAllText("$state\operator\control-pairing-link.txt").Trim()
  if($link -cnotmatch '^https://127\.0\.0\.1:4176/#pair=[A-Za-z0-9_-]{32,}$'){throw 'PAIRING_LINK_INVALID'}
}catch{
  $code=$null
  try{$code=($_.ErrorDetails.Message|ConvertFrom-Json).code}catch{}
  if($code -ne 'SESSION_STILL_ACTIVE'){throw 'OPERATOR_PAIRING_REOPEN_FAILED'}
  $link='https://127.0.0.1:4176/'
}
Start-Process $link
Write-Output 'Opened Operator page without printing credentials or pairing secrets. No VM operation performed.'
