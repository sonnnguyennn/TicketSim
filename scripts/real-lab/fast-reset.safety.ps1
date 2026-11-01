# Synthetic B5 checks. Overrides Hyper-V and backup collectors inside the imported module.
$ErrorActionPreference='Stop'
Import-Module (Join-Path $PSScriptRoot 'FastReset.Operator.psm1') -Force
$module=Get-Module FastReset.Operator
function Expect-Reject([string]$Name,[scriptblock]$Action,[string]$Code) {
  try { & $Action; throw "EXPECTED_REJECTION_$Name" } catch { if ($_.Exception.Message -notlike "*$Code*") { throw }; Write-Output "PASS $Name" }
}
$temp=Join-Path ([IO.Path]::GetTempPath()) ('ticketsim-b5-tests-'+[guid]::NewGuid())
$null=New-Item -ItemType Directory -Path $temp
try {
  & $module { param($root)
    $script:BackupRoot=$root
    function script:Assert-FastResetIdentity {
      [pscustomobject]@{Target=[pscustomobject]@{State=$script:targetState;SnapshotFileLocation='E:\TicketSimVMs\ticketsim-lab'};Recovery=[pscustomobject]@{State=$script:recoveryState};Protected=[pscustomobject]@{State='Off'};Disk=[pscustomobject]@{Path=$script:fakeDiskPath}}
    }
    function script:Assert-FastResetBackup { $true }
    function script:Get-FastResetResources { $script:resources }
    function script:Get-VHD { [pscustomobject]@{ParentPath=$script:fakeDiskParent} }
    function script:Get-VMSnapshot { $script:snapshots }
    $script:targetState='Off';$script:recoveryState='Running';$script:fakeDiskParent=$null;$script:fakeDiskPath='E:\TicketSimVMs\ticketsim-lab\ubuntu.vhdx'
    $script:resources=[pscustomobject]@{FreeRamBytes=4GB;CFreeBytes=16GB;EFreeBytes=50GB}
    $script:snapshots=@()
  } $temp
  $plan=Get-FastResetPlan checkpoint ''
  if ($plan.Applied -ne $false -or $plan.TargetVmId -ne '2b9c2170-9a23-4d08-b82e-29929afa4c10') { throw 'DRY_RUN_FAILED' }
  Write-Output 'PASS dry-run checkpoint plan'
  & $module { $script:snapshots=@([pscustomobject]@{Id=[guid]'00000000-0000-4000-8000-000000000002';Name='ticketsim-lab-b5-clean-baseline-v1'}) }
  Expect-Reject 'second checkpoint' { Get-FastResetPlan checkpoint '' } 'UNREVIEWED_CHECKPOINT_CHAIN'
  & $module { $script:recoveryState='Off';$script:fakeDiskParent='E:\TicketSimVMs\ticketsim-lab\ubuntu.vhdx';$script:fakeDiskPath='E:\TicketSimVMs\ticketsim-lab\active.avhdx' }
  Expect-Reject 'wrong checkpoint ID' { Get-FastResetPlan reset '00000000-0000-4000-8000-000000000003' } 'CHECKPOINT_ID_MISMATCH'
  $reset=Get-FastResetPlan reset '00000000-0000-4000-8000-000000000002'
  if ($reset.Applied -ne $false) { throw 'DRY_RUN_FAILED' }; Write-Output 'PASS exact reset plan'
  & $module { $script:recoveryState='Running' }
  Expect-Reject 'recovery VM running' { Get-FastResetPlan reset '00000000-0000-4000-8000-000000000002' } 'RECOVERY_VM_RUNNING'
  & $module { $script:recoveryState='Off';$script:resources.FreeRamBytes=2GB }
  Expect-Reject 'start RAM minimum' { Get-FastResetPlan start '00000000-0000-4000-8000-000000000002' } 'INSUFFICIENT_RAM'
  & $module { $script:resources.FreeRamBytes=4GB;$script:resources.EFreeBytes=14GB }
  Expect-Reject 'storage minimum' { Get-FastResetPlan reset '00000000-0000-4000-8000-000000000002' } 'INSUFFICIENT_STORAGE'
  & $module { $script:resources.EFreeBytes=50GB;Remove-Item Function:Assert-FastResetBackup; $script:BackupRoot=$args[0] } $temp
  Expect-Reject 'missing cold backup' { Assert-FastResetBackup } 'BACKUP_MISSING'
  $file=Join-Path $temp 'ticketsim-lab\Virtual Hard Disks\ubuntu.vhdx';$null=New-Item -ItemType Directory -Path (Split-Path -Parent $file) -Force;Set-Content -LiteralPath $file -Value 'synthetic'
  Expect-Reject 'backup size mismatch' { Assert-FastResetBackup } 'BACKUP_HASH_MISMATCH'
  Write-Output 'PASS no Hyper-V mutation command called'
} finally {
  if ($temp.StartsWith([IO.Path]::GetTempPath()) -and (Split-Path -Leaf $temp).StartsWith('ticketsim-b5-tests-')) { Remove-Item -LiteralPath $temp -Recurse -Force }
}
