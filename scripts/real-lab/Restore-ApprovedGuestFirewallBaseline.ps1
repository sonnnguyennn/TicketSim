param([switch]$Apply,[string]$Consent='')
$ErrorActionPreference='Stop'
if(-not $Apply){
  [pscustomobject]@{Apply=$false;VmId='2b9c2170-9a23-4d08-b82e-29929afa4c10';GuestCommand='systemctl is-active --quiet firewalld && sudo systemctl stop firewalld';Effect='One temporary firewall stop; no disable, permanent policy edit, reset or gate release'}|ConvertTo-Json
  return
}
if($Consent -cne 'APPROVE M4 original stop firewalld once 20261104'){throw 'EXACT_FIREWALL_REPAIR_CONSENT_REQUIRED'}
Import-Module (Join-Path $PSScriptRoot 'PilotShell.psm1') -Force
Set-PilotCallerModulePath
$identity=[Security.Principal.WindowsIdentity]::GetCurrent()
if(-not ([Security.Principal.WindowsPrincipal]$identity).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){throw 'OPERATOR_ELEVATION_REQUIRED'}
$state='C:\ProgramData\TicketSimPilot';$install='C:\Program Files\TicketSimPilot'
$request='m4-firewall-runtime-restore-20261104-001'
$journal="$state\operator\$request.json"
$bootFile="$state\operator\m4-original-boot-20261103-001.json"
if(Test-Path -LiteralPath $journal){throw 'REPAIR_RECORD_EXISTS_DO_NOT_RETRY'}
Import-Module (Join-Path $PSScriptRoot 'UpgradeProcess.psm1') -Force
$record=Get-M4InstallationRecord
if($record.phase -ne 'retired' -or $record.ownerId -ne '6c54ee60-4c6e-4183-9d38-0362be18b3c4' -or $record.releaseRoot -ine "$install\releases\4badc683-0432-4776-90d5-9b206d6e4d27" -or $record.operatorPrincipal -ine $identity.Name){throw 'APPROVED_REPAIR_RECORD_MISMATCH'}
$preparation=Get-Content "$state\operator\preparation.json" -Raw|ConvertFrom-Json
Import-Module (Join-Path $PSScriptRoot 'BootIntegrity.psm1') -Force
foreach($name in @('node.exe','powershell\pwsh.exe')){
  $null=Assert-BootDependencyIntegrity -RelativePath $name -InstallRoot $install -Preparation $preparation -VerifiedReleaseManifest ([pscustomobject]@{files=@()})
}
foreach($name in @('NODE_OPTIONS','NODE_PATH')){[Environment]::SetEnvironmentVariable($name,$null,'Process')}
function Assert-RepairAdmission {
  $output=& "$install\node.exe" (Join-Path $PSScriptRoot 'inspect-retired-upgrade.mjs') preboot
  if($LASTEXITCODE -ne 0){throw 'REPAIR_MAINTENANCE_NOT_VERIFIED'}
  $admission=$output|ConvertFrom-Json
  if($admission.eligible -ne $true -or $admission.purpose -ne 'approved-boot-precheck' -or $admission.ownerId -ne $record.ownerId -or $admission.releaseRoot -ine $record.releaseRoot){throw 'REPAIR_ADMISSION_BINDING_MISMATCH'}
}
Assert-RepairAdmission
$output=& "$install\node.exe" (Join-Path $PSScriptRoot 'inspect-firewall-repair.mjs')
if($LASTEXITCODE -ne 0){throw 'REPAIR_CURRENT_HOST_NOT_VERIFIED'}
$precheck=$output|ConvertFrom-Json
if($precheck.eligible -ne $true -or $precheck.ownerId -ne $record.ownerId){throw 'REPAIR_PRECHECK_BINDING_MISMATCH'}
$ssh='C:\Windows\System32\OpenSSH\ssh.exe'
$knownHosts="$state\shared\known-hosts"
$fingerprint=& 'C:\Windows\System32\OpenSSH\ssh-keygen.exe' -lf $knownHosts
if($LASTEXITCODE -ne 0 -or -not ($fingerprint -join "`n").Contains('SHA256:8LJ5bycBjgnfgRXp5tFh1jV/BGrfvb41rQQnzfbVi3U')){throw 'REPAIR_PINNED_HOST_KEY_NOT_VERIFIED'}
if((Get-FileHash -LiteralPath $bootFile -Algorithm SHA256).Hash -ine $precheck.failedBootSha256){throw 'FAILED_BOOT_EVIDENCE_CHANGED'}
Assert-RepairAdmission
$evidence=[ordered]@{requestId=$request;operation='stop-firewalld-once';status='reserved';ownerId=$record.ownerId;operatorPrincipal=$identity.Name;operatorSid=$identity.User.Value;vmId=$precheck.vmId;checkpointId=$precheck.checkpointId;failedBootSha256=$precheck.failedBootSha256;startedAt=[datetime]::UtcNow.ToString('o');sshExitCode=$null;verification=$null}
function Save-RepairEvidence([switch]$Create){
  $mode=if($Create){[IO.FileMode]::CreateNew}else{[IO.FileMode]::Create}
  $stream=[IO.File]::Open($journal,$mode,[IO.FileAccess]::Write,[IO.FileShare]::Read)
  try{$bytes=[Text.Encoding]::UTF8.GetBytes(($evidence|ConvertTo-Json -Depth 8));$stream.Write($bytes,0,$bytes.Length);$stream.Flush($true)}finally{$stream.Dispose()}
}
Save-RepairEvidence -Create
try{
  # Interactive password authentication is local only. One SSH dispatch and
  # one fixed sudo service stop; there is no retry or arbitrary command input.
  & $ssh -F NUL -t -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$knownHosts" -o ConnectionAttempts=1 -o ConnectTimeout=5 -o NumberOfPasswordPrompts=1 lab@10.77.77.3 'systemctl is-active --quiet firewalld && sudo systemctl stop firewalld'
  $evidence.sshExitCode=$LASTEXITCODE;$evidence.status='ssh_returned';Save-RepairEvidence
  if($evidence.sshExitCode -ne 0){throw 'REPAIR_SSH_OUTCOME_NOT_SUCCESS_DO_NOT_RETRY'}
  Assert-RepairAdmission
  $output=& "$install\node.exe" (Join-Path $PSScriptRoot 'verify-approved-boot.mjs')
  $verificationExit=$LASTEXITCODE
  if($output){$evidence.verification=$output|ConvertFrom-Json;Save-RepairEvidence}
  if($verificationExit -ne 0 -or $evidence.verification.verified -ne $true){
    if($evidence.verification){$evidence.verification|ConvertTo-Json -Depth 6}
    throw 'REPAIR_BASELINE_NOT_PASS_KEEP_QUARANTINE'
  }
  if((Get-FileHash -LiteralPath $bootFile -Algorithm SHA256).Hash -ine $precheck.failedBootSha256){throw 'FAILED_BOOT_EVIDENCE_CHANGED'}
  $evidence.status='verified';$evidence['completedAt']=[datetime]::UtcNow.ToString('o');Save-RepairEvidence
  Write-Output 'Temporary firewall repair verified against the original baseline. Failed boot record unchanged; maintenance gate retained. No runtime services started; reboot/reset stability remains unqualified.'
  $evidence.verification|ConvertTo-Json -Depth 6
}catch{
  $evidence['failedStage']=$evidence.status;$evidence.status='failed-quarantined';Save-RepairEvidence
  throw
}
