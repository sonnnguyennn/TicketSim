Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:TargetId = [guid]'2b9c2170-9a23-4d08-b82e-29929afa4c10'
$script:RecoveryId = [guid]'463dddf4-6e47-47b7-a39f-5b5d7ef84df0'
$script:ProtectedId = [guid]'546953dc-48e4-4080-839d-27ad5552ac7d'
$script:BackupRoot = 'C:\TicketSimBackups\baseline-2b9c2170-20261029'
$script:DiskPath = 'E:\TicketSimVMs\ticketsim-lab\ubuntu.vhdx'
$script:BackupDisk = 'ticketsim-lab\Virtual Hard Disks\ubuntu.vhdx'
$script:BackupHash = '3E410A9894FD5936A84B9625295081C5C2D3278D57C9D0BA8EBDD228661ED535'
$script:BaselineName = 'ticketsim-lab-b5-clean-baseline-v1'

function Assert-FastResetIdentity {
  $vms = @(Get-VM -ErrorAction Stop)
  foreach ($pair in @(@($script:TargetId,'ticketsim-lab'),@($script:RecoveryId,'ticketsim-lab-recovery'),@($script:ProtectedId,'lab1'))) {
    $matches = @($vms | Where-Object { $_.Id -eq $pair[0] -and $_.Name -eq $pair[1] })
    if ($matches.Count -ne 1) { throw 'VM_IDENTITY_MISMATCH' }
  }
  $target = @($vms | Where-Object Id -eq $script:TargetId)[0]
  $recovery = @($vms | Where-Object Id -eq $script:RecoveryId)[0]
  $disks = @(Get-VMHardDiskDrive -VM $target -ErrorAction Stop)
  if ($disks.Count -ne 1 -or $disks[0].Path -notlike 'E:\TicketSimVMs\ticketsim-lab\*') { throw 'TARGET_DISK_MISMATCH' }
  if ($target.Generation -ne 2 -or $target.ProcessorCount -ne 2 -or $target.MemoryStartup -ne 2GB -or $target.DynamicMemoryEnabled -eq $true -or $target.AutomaticCheckpointsEnabled -eq $true -or $target.AutomaticStartAction.ToString() -ne 'Nothing') { throw 'VM_SETTINGS_MISMATCH' }
  [pscustomobject]@{ Target=$target; Recovery=$recovery; Protected=@($vms | Where-Object Id -eq $script:ProtectedId)[0]; Disk=$disks[0] }
}

function Assert-FastResetBackup {
  $files = @(
    @($script:BackupDisk,7084179456,'3E410A9894FD5936A84B9625295081C5C2D3278D57C9D0BA8EBDD228661ED535'),
    @('ticketsim-lab\Virtual Machines\2B9C2170-9A23-4D08-B82E-29929AFA4C10.vmcx',45090,'3096D77512D531817406710E5E0A0E4DCFBCC077F9AA7A23DB64ABB02237AEF8'),
    @('ticketsim-lab\Virtual Machines\2B9C2170-9A23-4D08-B82E-29929AFA4C10.vmgs',4194816,'308116265B4040A441AD2939FBAF7673B298D7A4850CD8819B504E491DDDB274'),
    @('ticketsim-lab\Virtual Machines\2B9C2170-9A23-4D08-B82E-29929AFA4C10.VMRS',49152,'1F6B0F5A49E69BF748CA08747EC23EAF338587CAC98B411A11733BE957858D99')
  )
  foreach ($entry in $files) {
    $path = Join-Path $script:BackupRoot $entry[0]
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw 'BACKUP_MISSING' }
    $file = Get-Item -LiteralPath $path -ErrorAction Stop
    if ($file.Length -ne $entry[1] -or (Get-FileHash -LiteralPath $path -Algorithm SHA256 -ErrorAction Stop).Hash -ine $entry[2]) { throw 'BACKUP_HASH_MISMATCH' }
  }
  return $true
}

function Get-FastResetResources {
  $os = Get-CimInstance Win32_OperatingSystem -ErrorAction Stop
  $c = Get-PSDrive -Name C -ErrorAction Stop
  $e = Get-PSDrive -Name E -ErrorAction Stop
  if ($null -eq $os.FreePhysicalMemory -or $null -eq $c.Free -or $null -eq $e.Free) { throw 'RESOURCE_UNKNOWN' }
  [pscustomobject]@{ FreeRamBytes=([long]$os.FreePhysicalMemory * 1KB); CFreeBytes=[long]$c.Free; EFreeBytes=[long]$e.Free }
}

function Assert-FastResetResources($Resources, [string]$Action) {
  if ($Resources.CFreeBytes -lt 12GB -or $Resources.EFreeBytes -lt 15GB) { throw 'INSUFFICIENT_STORAGE' }
  if ($Action -eq 'start' -and $Resources.FreeRamBytes -lt 3GB) { throw 'INSUFFICIENT_RAM' }
  if ($Action -ne 'start' -and $Resources.FreeRamBytes -lt 1GB) { throw 'INSUFFICIENT_RAM' }
}

function Get-FastResetSnapshot($Target, [string]$CheckpointId) {
  $snapshots = @(Get-VMSnapshot -VM $Target -ErrorAction Stop)
  if ($CheckpointId) {
    $matches = @($snapshots | Where-Object { $_.Id.ToString() -eq $CheckpointId -and $_.Name -eq $script:BaselineName })
    if ($matches.Count -ne 1 -or $snapshots.Count -ne 1) { throw 'CHECKPOINT_ID_MISMATCH' }
    return $matches[0]
  }
  if ($snapshots.Count) { throw 'UNREVIEWED_CHECKPOINT_CHAIN' }
  return $null
}

function Get-FastResetPlan([string]$Action, [string]$CheckpointId) {
  if ($Action -notin @('checkpoint','start','stop','reset')) { throw 'UNKNOWN_ACTION' }
  $identity = Assert-FastResetIdentity
  $null = Assert-FastResetBackup
  $resources = Get-FastResetResources
  Assert-FastResetResources $resources $Action
  $disk = Get-VHD -Path $identity.Disk.Path -ErrorAction Stop
  if ($Action -eq 'checkpoint') {
    if ($identity.Target.State -ne 'Off') { throw 'TARGET_MUST_BE_OFF' }
    if ($identity.Disk.Path -ine $script:DiskPath -or $disk.ParentPath) { throw 'UNREVIEWED_DISK_CHAIN' }
    $snapshot = Get-FastResetSnapshot $identity.Target ''
  } else {
    $snapshot = Get-FastResetSnapshot $identity.Target $CheckpointId
  }
  if ($Action -in @('start','reset') -and $identity.Recovery.State -ne 'Off') { throw 'RECOVERY_VM_RUNNING' }
  if ($Action -in @('stop','reset') -and $identity.Target.State -ne $(if ($Action -eq 'stop') { 'Running' } else { 'Off' })) { throw 'TARGET_STATE_INVALID' }
  if ($Action -eq 'start' -and $identity.Target.State -ne 'Off') { throw 'TARGET_STATE_INVALID' }
  if ($Action -ne 'checkpoint' -and ($identity.Disk.Path -ieq $script:DiskPath -or $disk.ParentPath -ine $script:DiskPath)) { throw 'CHECKPOINT_DISK_CHAIN_UNKNOWN' }
  [pscustomobject]@{
    Action=$Action; TargetVmId=$script:TargetId.ToString(); TargetState=$identity.Target.State.ToString()
    RecoveryVmId=$script:RecoveryId.ToString(); RecoveryState=$identity.Recovery.State.ToString()
    ProtectedVmId=$script:ProtectedId.ToString(); BackupSha256=$script:BackupHash
    CheckpointId=if ($snapshot) { $snapshot.Id.ToString() } else { $null }
    DiskPath=$identity.Disk.Path; DiskParent=$disk.ParentPath; SnapshotFileLocation=$identity.Target.SnapshotFileLocation; Resources=$resources; Applied=$false
  }
}

function Get-FastResetCreatedCheckpoint($Vm) {
  # Do not infer snapshot identity from Checkpoint-VM's pipeline output.
  $matches = @(Get-VMSnapshot -VM $Vm -ErrorAction Stop)
  if ($matches.Count -ne 1 -or $matches[0].VMId -ne $script:TargetId -or $matches[0].Name -ne $script:BaselineName -or $Vm.State -ne 'Off') { throw 'CHECKPOINT_POSTCHECK_FAILED' }
  $drives = @(Get-VMHardDiskDrive -VM $Vm -ErrorAction Stop)
  if ($drives.Count -ne 1 -or $drives[0].Path -notlike 'E:\TicketSimVMs\ticketsim-lab\*.avhdx') { throw 'CHECKPOINT_CHAIN_POSTCHECK_FAILED' }
  $disk = Get-VHD -Path $drives[0].Path -ErrorAction Stop
  if ($disk.ParentPath -ine $script:DiskPath) { throw 'CHECKPOINT_CHAIN_POSTCHECK_FAILED' }
  return $matches[0]
}

function Invoke-FastResetOperator([string]$Action, [string]$RequestId, [string]$CheckpointId, [string]$StateRoot, [switch]$Apply, [string]$Approval) {
  if ($RequestId -notmatch '^[a-zA-Z0-9-]{8,64}$') { throw 'INVALID_REQUEST_ID' }
  if ($StateRoot -ine 'E:\TicketSimOperatorState\b5') { throw 'INVALID_STATE_ROOT' }
  $plan = Get-FastResetPlan $Action $CheckpointId
  if (-not $Apply) { return $plan }
  if ($Approval -cne "APPROVE B5 $Action $RequestId") { throw 'OPERATOR_APPROVAL_REQUIRED' }
  $null = New-Item -ItemType Directory -Path $StateRoot -Force
  $lease = Join-Path $StateRoot 'exclusive-lease'
  $journal = Join-Path $StateRoot "$RequestId.ndjson"
  if ((Test-Path -LiteralPath $lease) -or (Test-Path -LiteralPath $journal)) { throw 'OPERATOR_LEASE_OR_REQUEST_EXISTS' }
  $lock = [IO.FileStream]::new($lease,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
  $lock.Dispose()
  $record = [ordered]@{ RequestId=$RequestId; Action=$Action; VmId=$script:TargetId.ToString(); CheckpointId=$plan.CheckpointId; StartedAt=[DateTime]::UtcNow.ToString('o'); UpdatedAt=$null; Status='quarantined'; Result=$null; Error=$null }
  function Write-Record { $record.UpdatedAt=[DateTime]::UtcNow.ToString('o'); $line=($record | ConvertTo-Json -Compress -Depth 6)+"`n"; $bytes=[Text.Encoding]::UTF8.GetBytes($line); $stream=[IO.FileStream]::new($journal,[IO.FileMode]::Append,[IO.FileAccess]::Write,[IO.FileShare]::Read); try { $stream.Write($bytes,0,$bytes.Length); $stream.Flush($true) } finally { $stream.Dispose() } }
  Write-Record
  try {
    # Re-evaluate every safety gate after acquiring the exclusive lease.
    $plan = Get-FastResetPlan $Action $CheckpointId
    $vm = Get-VM -Id $script:TargetId -ErrorAction Stop
    switch ($Action) {
      checkpoint {
        $null = Checkpoint-VM -VM $vm -SnapshotName $script:BaselineName -ErrorAction Stop
        $created = Get-FastResetCreatedCheckpoint (Get-VM -Id $script:TargetId -ErrorAction Stop)
        $record.Result = @{ CheckpointId=$created.Id.ToString(); CheckpointType=$created.SnapshotType.ToString(); CreatedAt=$created.CreationTime.ToUniversalTime().ToString('o') }
      }
      start { Start-VM -VM $vm -ErrorAction Stop; if ((Get-VM -Id $script:TargetId).State -ne 'Running') { throw 'START_POSTCHECK_FAILED' }; $record.Result=@{State='Running'} }
      stop {
        Stop-VM -VM $vm -ErrorAction Stop
        $deadline=[DateTime]::UtcNow.AddSeconds(120)
        while ((Get-VM -Id $script:TargetId -ErrorAction Stop).State -ne 'Off' -and [DateTime]::UtcNow -lt $deadline) { Start-Sleep -Seconds 2 }
        if ((Get-VM -Id $script:TargetId).State -ne 'Off') { throw 'SHUTDOWN_NOT_CONFIRMED' }
        $record.Result=@{State='Off'}
      }
      reset { $snapshot=Get-FastResetSnapshot $vm $CheckpointId; Restore-VMSnapshot -VMSnapshot $snapshot -Confirm:$false -ErrorAction Stop; if ((Get-VM -Id $script:TargetId).State -ne 'Off') { throw 'RESET_POSTCHECK_FAILED' }; $record.Result=@{CheckpointId=$snapshot.Id.ToString();State='Off'} }
    }
    $record.Status='awaiting-independent-verification'
  } catch { $record.Status='failed-quarantined'; $record.Error=$_.Exception.Message; throw }
  finally { Write-Record }
  return $record
}

Export-ModuleMember -Function Get-FastResetPlan,Invoke-FastResetOperator,Assert-FastResetResources,Assert-FastResetBackup
