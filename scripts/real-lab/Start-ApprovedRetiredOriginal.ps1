param([switch]$Apply)
$ErrorActionPreference='Stop'
if(-not $Apply){
  [pscustomobject]@{Apply=$false;Approval='User approved one original boot after retired-upgrade diagnostic';VmId='2b9c2170-9a23-4d08-b82e-29929afa4c10';Effect='Boot once, verify guest SSH/HTTP, keep maintenance gate; no reset/checkpoint/service startup'}|ConvertTo-Json
  return
}
Import-Module (Join-Path $PSScriptRoot 'PilotShell.psm1') -Force
Set-PilotCallerModulePath
$identity=[Security.Principal.WindowsIdentity]::GetCurrent()
if(-not ([Security.Principal.WindowsPrincipal]$identity).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){throw 'OPERATOR_ELEVATION_REQUIRED'}
$state='C:\ProgramData\TicketSimPilot'
$install='C:\Program Files\TicketSimPilot'
$targetId=[guid]'2b9c2170-9a23-4d08-b82e-29929afa4c10'
$checkpointId='e6d04330-142c-4397-8e0d-ddf5a9e69090'
$journal="$state\operator\m4-original-boot-20261103-001.json"
if(Test-Path -LiteralPath $journal){throw 'BOOT_RECORD_EXISTS_DO_NOT_RETRY'}
Import-Module (Join-Path $PSScriptRoot 'UpgradeProcess.psm1') -Force
$record=Get-M4InstallationRecord
if($record.phase -ne 'retired' -or $record.ownerId -ne '6c54ee60-4c6e-4183-9d38-0362be18b3c4' -or $record.releaseRoot -ine "$install\releases\4badc683-0432-4776-90d5-9b206d6e4d27" -or $record.operatorPrincipal -ine $identity.Name){throw 'APPROVED_RETIRED_RECORD_MISMATCH'}
$preparation=Get-Content "$state\operator\preparation.json" -Raw|ConvertFrom-Json
foreach($name in @('node.exe','powershell\pwsh.exe','scripts\real-lab\FastReset.Operator.psm1')){
  if((Get-FileHash -LiteralPath (Join-Path $install $name) -Algorithm SHA256).Hash -ne $preparation.CodeHashes.$name){throw 'QUALIFIED_BOOT_DEPENDENCY_HASH_CHANGED'}
}
foreach($name in @('NODE_OPTIONS','NODE_PATH')){[Environment]::SetEnvironmentVariable($name,$null,'Process')}
function Assert-RetiredBootAdmission {
  $output=& "$install\node.exe" (Join-Path $PSScriptRoot 'inspect-retired-upgrade.mjs') preboot
  if($LASTEXITCODE -ne 0){throw 'BOOT_ADMISSION_NOT_VERIFIED'}
  $admission=$output|ConvertFrom-Json
  if($admission.eligible -ne $true -or $admission.purpose -ne 'approved-boot-precheck' -or $admission.ownerId -ne $record.ownerId -or $admission.releaseRoot -ine $record.releaseRoot){throw 'BOOT_ADMISSION_BINDING_MISMATCH'}
}
Assert-RetiredBootAdmission
if(Test-Path -LiteralPath 'E:\TicketSimOperatorState\b5\exclusive-lease'){throw 'B5_LEASE_HELD'}
if(@(Get-CimInstance Win32_Process|Where-Object {$_.ExecutablePath -in @("$install\node.exe","$($record.releaseRoot)\node.exe")}).Count){throw 'UNEXPECTED_RUNTIME_PRESENT_NO_BOOT'}
# The qualified planner hashes all four backups and checks original identity,
# checkpoint, disk parent and RAM/storage floors. It performs no VM action.
Import-Module "$install\scripts\real-lab\FastReset.Operator.psm1" -Force
$plan=Get-FastResetPlan -Action start -CheckpointId $checkpointId
$vm=Get-VM -Id $targetId -ErrorAction Stop
$snapshots=@(Get-VMSnapshot -VM $vm -ErrorAction Stop)
if($snapshots.Count -ne 1 -or $snapshots[0].SnapshotType.ToString() -ne 'Standard' -or $snapshots[0].Id.ToString() -ne $checkpointId){throw 'BOOT_CHECKPOINT_MISMATCH'}
foreach($id in @('463dddf4-6e47-47b7-a39f-5b5d7ef84df0','546953dc-48e4-4080-839d-27ad5552ac7d')){
  if((Get-VM -Id $id -ErrorAction Stop).State.ToString() -ne 'Off'){throw 'OTHER_VM_NOT_OFF'}
}
Assert-RetiredBootAdmission
$evidence=[ordered]@{requestId='m4-original-boot-20261103-001';status='reserved';ownerId=$record.ownerId;vmId=$targetId.ToString();checkpointId=$checkpointId;approvedAction='single original boot';startedAt=[datetime]::UtcNow.ToString('o');precheck=$plan;verification=$null}
function Save-BootEvidence([switch]$Create){
  $mode=if($Create){[IO.FileMode]::CreateNew}else{[IO.FileMode]::Create}
  $stream=[IO.File]::Open($journal,$mode,[IO.FileAccess]::Write,[IO.FileShare]::Read)
  try{$bytes=[Text.Encoding]::UTF8.GetBytes(($evidence|ConvertTo-Json -Depth 8));$stream.Write($bytes,0,$bytes.Length);$stream.Flush($true)}finally{$stream.Dispose()}
}
# Durable single-use reservation precedes the only VM-changing command.
Save-BootEvidence -Create
try{
  if((Get-VM -Id $targetId -ErrorAction Stop).State.ToString() -ne 'Off'){throw 'BOOT_TARGET_STATE_CHANGED'}
  $resources=[pscustomobject]@{FreeRamBytes=[long](Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory*1KB;CFreeBytes=([IO.DriveInfo]'C:\').AvailableFreeSpace;EFreeBytes=([IO.DriveInfo]'E:\').AvailableFreeSpace}
  Assert-FastResetResources $resources 'start'
  Start-VM -VM (Get-VM -Id $targetId -ErrorAction Stop) -ErrorAction Stop
  $evidence.status='boot_returned';Save-BootEvidence
  if((Get-VM -Id $targetId -ErrorAction Stop).State.ToString() -ne 'Running'){throw 'BOOT_OUTCOME_NOT_RUNNING_DO_NOT_RETRY'}
  # Repeat only read-only readiness probes; never repeat Start-VM.
  $deadline=[datetime]::UtcNow.AddSeconds(90);$httpReady=$false
  do{
    try{$response=Invoke-WebRequest 'http://10.77.77.3/' -UseBasicParsing -TimeoutSec 3;if($response.StatusCode -eq 200){$httpReady=$true;break}}catch{}
    Start-Sleep -Milliseconds 1000
  }while([datetime]::UtcNow -lt $deadline)
  if(-not $httpReady){throw 'BOOT_HTTP_READINESS_TIMEOUT_DO_NOT_RESET'}
  $output=& "$install\node.exe" (Join-Path $PSScriptRoot 'verify-approved-boot.mjs')
  $verificationExit=$LASTEXITCODE
  if($verificationExit -ne 0){
    if($output){$evidence.verification=$output|ConvertFrom-Json;Save-BootEvidence;$evidence.verification|ConvertTo-Json -Depth 6}
    throw 'BOOT_GUEST_VERIFICATION_FAILED_KEEP_RECORD'
  }
  $verification=$output|ConvertFrom-Json
  if($verification.verified -ne $true -or $verification.vmId -ne $targetId.ToString() -or $verification.checkpointId -ne $checkpointId){throw 'BOOT_VERIFICATION_BINDING_MISMATCH'}
  $evidence.verification=$verification;$evidence.status='verified';$evidence['completedAt']=[datetime]::UtcNow.ToString('o');Save-BootEvidence
  Write-Output 'Original booted once; M3, fixed SSH host key/authentication, HTTP exact content and baseline checks verified. Maintenance gate retained. No fault/reset/checkpoint or pilot service startup.'
  $verification|ConvertTo-Json -Depth 6
}catch{
  $evidence.status='failed-quarantined';Save-BootEvidence
  throw
}
