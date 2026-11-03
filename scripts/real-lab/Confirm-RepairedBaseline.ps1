param([switch]$Record)
$ErrorActionPreference='Stop'
if(-not $Record){
  [pscustomobject]@{Record=$false;Action='Fresh read-only Operator SSH/HTTP/host/backup baseline verification; create separate hash-linked evidence only on PASS. No guest mutation, failed-record edit or gate release.'}|ConvertTo-Json
  return
}
Import-Module (Join-Path $PSScriptRoot 'PilotShell.psm1') -Force
Set-PilotCallerModulePath
$identity=[Security.Principal.WindowsIdentity]::GetCurrent()
if(-not ([Security.Principal.WindowsPrincipal]$identity).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){throw 'OPERATOR_ELEVATION_REQUIRED'}
$state='C:\ProgramData\TicketSimPilot';$install='C:\Program Files\TicketSimPilot'
Import-Module (Join-Path $PSScriptRoot 'UpgradeProcess.psm1') -Force
$upgradeRecord=Get-M4InstallationRecord
if($upgradeRecord.phase -ne 'retired' -or $upgradeRecord.ownerId -ne '6c54ee60-4c6e-4183-9d38-0362be18b3c4' -or $upgradeRecord.releaseRoot -ine "$install\releases\4badc683-0432-4776-90d5-9b206d6e4d27" -or $upgradeRecord.operatorPrincipal -ine $identity.Name){throw 'RETIRED_VERIFICATION_RECORD_MISMATCH'}
$preparation=Get-Content "$state\operator\preparation.json" -Raw|ConvertFrom-Json
Import-Module (Join-Path $PSScriptRoot 'BootIntegrity.psm1') -Force
$null=Assert-BootDependencyIntegrity -RelativePath 'node.exe' -InstallRoot $install -Preparation $preparation -VerifiedReleaseManifest ([pscustomobject]@{files=@()})
foreach($name in @('NODE_OPTIONS','NODE_PATH')){[Environment]::SetEnvironmentVariable($name,$null,'Process')}
$output=& "$install\node.exe" (Join-Path $PSScriptRoot 'inspect-retired-upgrade.mjs') preboot
if($LASTEXITCODE -ne 0){throw 'VERIFICATION_MAINTENANCE_NOT_CLEAR'}
$admission=$output|ConvertFrom-Json
if($admission.eligible -ne $true -or $admission.ownerId -ne $upgradeRecord.ownerId -or $admission.releaseRoot -ine $upgradeRecord.releaseRoot -or $admission.purpose -ne 'approved-boot-precheck'){throw 'VERIFICATION_ADMISSION_BINDING_MISMATCH'}
& "$install\node.exe" (Join-Path $PSScriptRoot 'reconcile-firewall-verification.mjs')
if($LASTEXITCODE -ne 0){throw 'BASELINE_NOT_RECONCILED_KEEP_GATE_NO_MUTATION_RETRY'}
