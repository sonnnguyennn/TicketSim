param(
  [Parameter(Mandatory)][ValidateSet('inspect','reset')][string]$Action,
  [Parameter(Mandatory)][guid]$CheckpointId
)
$ErrorActionPreference = 'Stop'
$targetId = [guid]'2b9c2170-9a23-4d08-b82e-29929afa4c10'
$recoveryId = [guid]'463dddf4-6e47-47b7-a39f-5b5d7ef84df0'
$protectedId = [guid]'546953dc-48e4-4080-839d-27ad5552ac7d'
$backupDisk = 'C:\TicketSimBackups\baseline-2b9c2170-20261029\ticketsim-lab\Virtual Hard Disks\ubuntu.vhdx'
$expectedHash = '3E410A9894FD5936A84B9625295081C5C2D3278D57C9D0BA8EBDD228661ED535'
$expectedName = 'ticketsim-lab-b5-clean-baseline-v1'
if (Test-Path -LiteralPath 'E:\TicketSimOperatorState\b5\exclusive-lease') { throw 'B5_OPERATOR_LEASE_UNRESOLVED' }

function Inspect-Host {
  $vms = @(Get-VM -ErrorAction Stop)
  $target = @($vms | Where-Object Id -eq $targetId)
  $recovery = @($vms | Where-Object Id -eq $recoveryId)
  $protected = @($vms | Where-Object Id -eq $protectedId)
  if ($target.Count -ne 1 -or $recovery.Count -ne 1 -or $protected.Count -ne 1 -or $target[0].Name -ne 'ticketsim-lab' -or $recovery[0].Name -ne 'ticketsim-lab-recovery' -or $protected[0].Name -ne 'lab1') { throw 'VM_IDENTITY_MISMATCH' }
  $snapshots = @(Get-VMSnapshot -VM $target[0] -ErrorAction Stop)
  if ($snapshots.Count -ne 1 -or $snapshots[0].Id -ne $CheckpointId -or $snapshots[0].Name -ne $expectedName) { throw 'CHECKPOINT_ID_MISMATCH' }
  if ($snapshots[0].SnapshotType.ToString() -ne 'Standard') { throw 'CHECKPOINT_TYPE_MISMATCH' }
  $disks = @(Get-VMHardDiskDrive -VM $target[0] -ErrorAction Stop)
  if ($disks.Count -ne 1 -or $disks[0].Path -notlike 'E:\TicketSimVMs\ticketsim-lab\*') { throw 'TARGET_DISK_MISMATCH' }
  $diskChain = @(); $cursor = $disks[0].Path; $seen = @{}
  while ($cursor) {
    if ($seen.ContainsKey($cursor) -or $cursor -notlike 'E:\TicketSimVMs\ticketsim-lab\*') { throw 'DISK_CHAIN_INVALID' }
    $seen[$cursor] = $true
    $vhd = Get-VHD -Path $cursor -ErrorAction Stop
    $diskChain += [pscustomobject]@{ Path=$cursor; FileSize=$vhd.FileSize; ParentPath=$vhd.ParentPath }
    $cursor = $vhd.ParentPath
  }
  if ($diskChain[-1].Path -ine 'E:\TicketSimVMs\ticketsim-lab\ubuntu.vhdx') { throw 'DISK_CHAIN_BASE_MISMATCH' }
  Import-Module (Join-Path $PSScriptRoot 'FastReset.Operator.psm1') -Force
  $null = Assert-FastResetBackup
  $actualHash = $expectedHash
  $management = @(Get-VMNetworkAdapter -VM $target[0] -ErrorAction Stop | Where-Object { $_.SwitchId -eq [guid]'4277a35c-217f-4096-a1a9-a691975f150f' })
  if ($management.Count -ne 1 -or $management[0].MacAddress -ne '00155D380102') { throw 'MANAGEMENT_BINDING_MISMATCH' }
  $os = Get-CimInstance Win32_OperatingSystem -ErrorAction Stop
  $c = Get-PSDrive -Name C -ErrorAction Stop
  $e = Get-PSDrive -Name E -ErrorAction Stop
  if ($null -eq $os.FreePhysicalMemory -or $null -eq $c.Free -or $null -eq $e.Free) { throw 'RESOURCE_UNKNOWN' }
  [pscustomobject]@{
    targetVmId=$targetId.ToString(); targetName=$target[0].Name; targetState=$target[0].State.ToString()
    recoveryVmId=$recoveryId.ToString(); recoveryState=$recovery[0].State.ToString()
    protectedVmId=$protectedId.ToString(); protectedName=$protected[0].Name; protectedState=$protected[0].State.ToString()
    checkpointId=$snapshots[0].Id.ToString(); checkpointName=$snapshots[0].Name; checkpointCount=$snapshots.Count
    backupSha256=$actualHash; managementSwitchId=$management[0].SwitchId.ToString()
    diskChain=$diskChain
    freeRamBytes=([long]$os.FreePhysicalMemory * 1KB); cFreeBytes=[long]$c.Free; eFreeBytes=[long]$e.Free
  }
}

$before = Inspect-Host
if ($Action -eq 'reset') {
  if ($before.recoveryState -ne 'Off' -or $before.targetState -ne 'Running') { throw 'RESET_STATE_INVALID' }
  if ($before.freeRamBytes -lt 1GB -or $before.cFreeBytes -lt 12GB -or $before.eFreeBytes -lt 15GB) { throw 'RESOURCE_MINIMUM_FAILED' }
  $vm = Get-VM -Id $targetId -ErrorAction Stop
  Stop-VM -VM $vm -ErrorAction Stop
  $deadline = [DateTime]::UtcNow.AddSeconds(120)
  while ((Get-VM -Id $targetId -ErrorAction Stop).State -ne 'Off' -and [DateTime]::UtcNow -lt $deadline) { Start-Sleep -Seconds 2 }
  if ((Get-VM -Id $targetId -ErrorAction Stop).State -ne 'Off') { throw 'CLEAN_SHUTDOWN_TIMEOUT' }
  $snapshot = @(Get-VMSnapshot -VM (Get-VM -Id $targetId) -ErrorAction Stop | Where-Object Id -eq $CheckpointId)
  if ($snapshot.Count -ne 1) { throw 'CHECKPOINT_CHANGED' }
  $null = Restore-VMSnapshot -VMSnapshot $snapshot[0] -Confirm:$false -ErrorAction Stop
  $afterReset = Get-VM -Id $targetId -ErrorAction Stop
  if ($afterReset.State -ne 'Off') { throw 'RESET_NOT_OFF' }
  $freeRam = [long](Get-CimInstance Win32_OperatingSystem -ErrorAction Stop).FreePhysicalMemory * 1KB
  if ($freeRam -lt 3GB) { throw 'INSUFFICIENT_RAM_TO_BOOT' }
  Start-VM -VM $afterReset -ErrorAction Stop
  $after = Inspect-Host
  if ($after.targetState -ne 'Running' -or $after.recoveryState -ne 'Off') { throw 'RESET_POSTCHECK_FAILED' }
  if ($after.protectedState -ne $before.protectedState) { throw 'PROTECTED_STATE_CHANGED' }
  $after | ConvertTo-Json -Depth 5 -Compress
} else {
  $before | ConvertTo-Json -Depth 5 -Compress
}
