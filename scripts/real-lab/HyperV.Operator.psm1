Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$protectedId = '546953dc-48e4-4080-839d-27ad5552ac7d'

function Assert-LabPath([string]$Path) {
  # Only ordinary local drive paths. Reject ADS, device paths and Win32 alias segments.
  if ($Path -notmatch '^[A-Za-z]:\\' -or $Path.Substring(2) -match '[:*?]' -or ($Path -split '\\' | Where-Object { $_ -match '[. ]$' -or $_ -match '^(?i:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)' })) { throw 'INVALID_PATH' }
  $full = [IO.Path]::GetFullPath($Path)
  if ($full.TrimEnd('\') -eq [IO.Path]::GetPathRoot($full).TrimEnd('\')) { throw 'ROOT_PATH_FORBIDDEN' }
  $cursor = $full
  while ($cursor) {
    if (Test-Path -LiteralPath $cursor) {
      if ((Get-Item -LiteralPath $cursor).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'REPARSE_PATH_FORBIDDEN' }
    }
    $parent = Split-Path -Parent $cursor
    if ($parent -eq $cursor) { break }; $cursor = $parent
  }
  return $full
}

function Get-LabInventory {
  # Any read failure aborts planning, rather than returning a healthy empty inventory.
  $vms = @(Get-VM -ErrorAction Stop)
  $switches = @(Get-VMSwitch -ErrorAction Stop)
  $adapters = @($vms | Get-VMNetworkAdapter -ErrorAction Stop)
  $vhd = @($vms | Get-VMHardDiskDrive -ErrorAction Stop | ForEach-Object { Get-VHD -Path $_.Path -ErrorAction Stop })
  [pscustomobject]@{ Vms = $vms; Switches = $switches; Adapters = $adapters; Vhds = $vhd }
}

function New-LabPlan($Config, $Inventory, [string]$Operation) {
  if ($Config.Name -ne 'ticketsim-lab' -or $Config.VmId -eq $protectedId) { throw 'PROTECTED_TARGET' }
  if ($Operation -notin @('provision','checkpoint','reset','backup','restore-copy')) { throw 'UNKNOWN_OPERATION' }
  if ($Config.Controller -ne 'hyperv' -or $Config.DisposableApproved -ne $true) { throw 'TARGET_NOT_APPROVED' }
  if ($Config.Cpu -ne 2 -or $Config.MemoryBytes -ne 2GB -or $Config.MaxDiskBytes -ne 20GB) { throw 'UNREVIEWED_SIZING' }
  foreach ($key in @('VmRoot','BackupRoot','DrillRoot','StateRoot','SourceVhd')) { $Config.$key = Assert-LabPath $Config.$key }
  $paths = @($Config.VmRoot,$Config.BackupRoot,$Config.DrillRoot,$Config.StateRoot)
  for ($i=0; $i -lt $paths.Count; $i++) { for ($j=0; $j -lt $paths.Count; $j++) {
    if ($i -ne $j -and ($paths[$i].TrimEnd('\') + '\').StartsWith($paths[$j].TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'OVERLAPPING_PATHS' }
  } }
  if ([IO.Path]::GetPathRoot($Config.BackupRoot) -eq [IO.Path]::GetPathRoot($Config.VmRoot)) { throw 'BACKUP_VOLUME_NOT_INDEPENDENT' }
  if ($Config.SourceVhd -notmatch '\.vhdx$' -or -not (Test-Path -LiteralPath $Config.SourceVhd -PathType Leaf)) { throw 'SOURCE_MISSING' }
  if ($Config.SourceSha256 -notmatch '^[a-fA-F0-9]{64}$' -or (Get-FileHash -LiteralPath $Config.SourceVhd -Algorithm SHA256).Hash -ne $Config.SourceSha256) { throw 'SOURCE_HASH_MISMATCH' }
  if (@($Inventory.Vhds | ForEach-Object Path) -contains $Config.SourceVhd) { throw 'SOURCE_IS_ATTACHED' }
  if ($Config.ManagementIp -notmatch '^10\.77\.77\.(?:[3-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-4])$' -or $Config.IpAllocationVerified -ne $true) { throw 'IP_ALLOCATION_UNVERIFIED' }
  if ($Config.ManagementMac -notmatch '^02[0-9A-Fa-f]{10}$' -or $Config.NatMac -notmatch '^02[0-9A-Fa-f]{10}$' -or $Config.ManagementMac -eq $Config.NatMac) { throw 'INVALID_MAC' }
  foreach ($mac in @($Config.ManagementMac,$Config.NatMac)) { if (@($Inventory.Adapters | Where-Object { $_.VMId -ne $Config.VmId -and ($_.MacAddress -replace '[:-]','') -eq $mac }).Count) { throw 'MAC_COLLISION' } }
  if (@($Inventory.Adapters | Where-Object { $_.VMId -ne $Config.VmId -and $_.IPAddresses -contains $Config.ManagementIp }).Count) { throw 'IP_COLLISION' }
  $mgmt = @($Inventory.Switches | Where-Object { $_.Id -eq $Config.ManagementSwitchId -and $_.SwitchType -eq 'Internal' })
  $nat = @($Inventory.Switches | Where-Object { $_.Id -eq $Config.NatSwitchId })
  if ($mgmt.Count -ne 1 -or $nat.Count -ne 1 -or $Config.ManagementSwitchId -eq $Config.NatSwitchId -or $Config.SwitchMappingVerified -ne $true) { throw 'SWITCH_UNVERIFIED' }
  $existing = @($Inventory.Vms | Where-Object Name -eq $Config.Name)
  if ($Operation -eq 'restore-copy' -and @($Inventory.Vms | Where-Object Name -eq 'ticketsim-lab-recovery').Count) { throw 'DRILL_VM_COLLISION' }
  if ($Operation -eq 'provision') {
    if ($existing.Count -or $Config.VmId -or (Test-Path -LiteralPath $Config.VmRoot)) { throw 'VM_COLLISION' }
  } else {
    if (-not $Config.VmId -or $existing.Count -ne 1 -or $existing[0].Id.ToString() -ne $Config.VmId -or $existing[0].State -ne 'Off') { throw 'AMBIGUOUS_OR_RUNNING_TARGET' }
  }
  [pscustomobject]@{ Operation=$Operation; Name=$Config.Name; VmId=$Config.VmId; ManagementSwitch=$mgmt[0].Name; NatSwitch=$nat[0].Name; Apply=$false }
}

function Assert-LabCapacity($Config) {
  $os = Get-CimInstance Win32_OperatingSystem
  if ($os.FreePhysicalMemory * 1KB -lt ($Config.MemoryBytes + 2GB)) { throw 'INSUFFICIENT_RAM' }
  $budgets = @{}
  $volumes = @{}
  foreach ($root in @($Config.VmRoot,$Config.BackupRoot,$Config.DrillRoot)) {
    $volume = Get-Volume -FilePath (Split-Path -Parent $root) -ErrorAction Stop
    if (-not $volume.UniqueId -or $null -eq $volume.SizeRemaining) { throw 'VOLUME_UNKNOWN' }
    $volumes[$root] = $volume
    if (-not $budgets.ContainsKey($volume.UniqueId)) { $budgets[$volume.UniqueId] = 10GB }
    $budgets[$volume.UniqueId] += $Config.MaxDiskBytes
    if ($root -eq $Config.VmRoot) { $budgets[$volume.UniqueId] += $Config.MaxDiskBytes } # one checkpoint growth budget
  }
  if ($volumes[$Config.BackupRoot].UniqueId -eq $volumes[$Config.VmRoot].UniqueId -or $volumes[$Config.BackupRoot].UniqueId -eq $volumes[$Config.DrillRoot].UniqueId) { throw 'BACKUP_VOLUME_NOT_INDEPENDENT' }
  foreach ($volume in $volumes.Values) {
    if ($volume.SizeRemaining -lt $budgets[$volume.UniqueId]) { throw 'INSUFFICIENT_STORAGE' }
  }
}

function Write-LabJournal([string]$Path, $Record, [switch]$Initial) {
  $Record.UpdatedAt = [DateTime]::UtcNow.ToString('o')
  $bytes = [Text.Encoding]::UTF8.GetBytes(($Record | ConvertTo-Json -Depth 8 -Compress) + "`n")
  $mode = if ($Initial) { [IO.FileMode]::CreateNew } else { [IO.FileMode]::Append }
  $stream = [IO.FileStream]::new($Path,$mode,[IO.FileAccess]::Write,[IO.FileShare]::Read)
  try { $stream.Write($bytes,0,$bytes.Length); $stream.Flush($true) } finally { $stream.Dispose() }
}

function Get-BackupFiles([string]$Root) {
  @(Get-ChildItem -LiteralPath $Root -File -Recurse | Where-Object Name -ne 'integrity.json' | ForEach-Object {
    $null = Assert-LabPath $_.FullName
    [pscustomobject]@{ Path=[IO.Path]::GetRelativePath($Root,$_.FullName); Hash=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash }
  })
}

function Assert-LabBackup($Config) {
  $manifestPath = Join-Path $Config.BackupRoot 'integrity.json'
  if (-not (Test-Path -LiteralPath $manifestPath)) { throw 'BACKUP_MISSING' }
  $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
  if ($manifest.VmId -ne $Config.VmId -or $manifest.BaselineFingerprint -notmatch '^[a-fA-F0-9]{64}$' -or $manifest.BaselineFingerprint -ne $Config.BaselineFingerprint) { throw 'BACKUP_IDENTITY_INVALID' }
  $actual = @(Get-BackupFiles $Config.BackupRoot)
  if (-not $actual.Count -or $actual.Count -ne @($manifest.Files).Count) { throw 'BACKUP_INVALID' }
  foreach ($file in $actual) { if (@($manifest.Files | Where-Object { $_.Path -eq $file.Path -and $_.Hash -eq $file.Hash }).Count -ne 1) { throw 'BACKUP_HASH_MISMATCH' } }
  return $manifest
}

function Assert-LabRecovery($Config, $Evidence) {
  if ($Evidence.VmId -eq $protectedId -or $Evidence.VmId -eq $Config.VmId -or -not $Evidence.VmId) { throw 'RESTORE_IDENTITY_INVALID' }
  foreach ($key in @('DistinctMacAndIp','Console','Boot','SshHostKey','SshAuthentication','HttpStatus','HttpContent','NginxVersion','UbuntuVersion','HostRecoveryWithoutSsh')) {
    if ($Evidence.$key -ne $true) { throw 'RESTORE_NOT_VERIFIED' }
  }
  if ($Evidence.BaselineFingerprint -ne $Config.BaselineFingerprint -or $Config.BaselineFingerprint -notmatch '^[a-fA-F0-9]{64}$' -or $Evidence.DurationSeconds -le 0) { throw 'RESTORE_BASELINE_INVALID' }
  return 'verified-evidence-only'
}

function Assert-LabRequest([string]$StateRoot, [string]$RequestId) {
  if (Test-Path -LiteralPath (Join-Path $StateRoot 'exclusive-lease')) { throw 'LEASE_QUARANTINED' }
  if (Test-Path -LiteralPath (Join-Path $StateRoot "$RequestId.json")) { throw 'DUPLICATE_REQUEST' }
}

function Invoke-LabOperator($Config, [string]$Operation, [string]$RequestId, [switch]$Apply, [string]$Approval) {
  if ($RequestId -notmatch '^[a-zA-Z0-9-]{8,64}$') { throw 'INVALID_REQUEST_ID' }
  $inventory = Get-LabInventory
  $plan = New-LabPlan $Config $inventory $Operation
  $sourceDisk = Get-VHD -Path $Config.SourceVhd -ErrorAction Stop
  if ($sourceDisk.Size -gt $Config.MaxDiskBytes -or $sourceDisk.ParentPath) { throw 'UNSAFE_SOURCE_DISK' }
  Assert-LabCapacity $Config
  if ($Operation -eq 'restore-copy') { $null = Assert-LabBackup $Config }
  if (-not $Apply) { return $plan }
  if ($Approval -cne "APPROVE GATE B $Operation $RequestId") { throw 'GATE_B_APPROVAL_REQUIRED' }
  # Exclusive persistent quarantine directory. A crash/failed verification never removes it.
  $null = New-Item -ItemType Directory -Path $Config.StateRoot -Force
  $lease = Join-Path $Config.StateRoot 'exclusive-lease'
  Assert-LabRequest $Config.StateRoot $RequestId
  $requestPath = Join-Path $Config.StateRoot "$RequestId.json"
  $null = New-Item -ItemType Directory -Path $lease -ErrorAction Stop
  $record = [ordered]@{ RequestId=$RequestId; Operation=$Operation; VmId=$Config.VmId; Approval=$Approval; StartedAt=[DateTime]::UtcNow.ToString('o'); UpdatedAt=$null; Status='quarantined'; Result=$null; Error=$null }
  Write-LabJournal $requestPath $record -Initial
  try {
    # Re-read under the lease to catch collisions since planning.
    $plan = New-LabPlan $Config (Get-LabInventory) $Operation
    Assert-LabCapacity $Config
    if ($Operation -ne 'provision') {
      $attached = @(Get-VMHardDiskDrive -VM (Get-VM -Id $Config.VmId))
      if (-not $attached.Count) { throw 'DISK_BINDING_UNKNOWN' }
      foreach ($disk in $attached) {
        $fullDisk = Assert-LabPath $disk.Path
        if (-not $fullDisk.StartsWith($Config.VmRoot.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'DISK_BINDING_MISMATCH' }
      }
    }
    switch ($Operation) {
      provision {
        $null = New-Item -ItemType Directory -Path $Config.VmRoot
        $disk = Join-Path $Config.VmRoot 'ubuntu.vhdx'
        [IO.File]::Copy($Config.SourceVhd,$disk,$false)
        $vhd = Get-VHD -Path $disk
        if ($vhd.Size -gt $Config.MaxDiskBytes -or $vhd.ParentPath) { throw 'UNSAFE_SOURCE_DISK' }
        $vm = New-VM -Name 'ticketsim-lab' -Generation 2 -MemoryStartupBytes $Config.MemoryBytes -VHDPath $disk -Path $Config.VmRoot -SwitchName $plan.NatSwitch
        $record.Result = @{ VmId=$vm.Id.ToString() }
        Write-LabJournal $requestPath $record
        Set-VMProcessor -VM $vm -Count 2
        Set-VMMemory -VM $vm -DynamicMemoryEnabled $false
        Set-VM -VM $vm -AutomaticStartAction Nothing -AutomaticStopAction ShutDown
        Set-VMFirmware -VM $vm -EnableSecureBoot On -SecureBootTemplate MicrosoftUEFICertificateAuthority
        Get-VMNetworkAdapter -VM $vm | Set-VMNetworkAdapter -StaticMacAddress $Config.NatMac
        Add-VMNetworkAdapter -VM $vm -Name 'management' -SwitchName $plan.ManagementSwitch -StaticMacAddress $Config.ManagementMac
      }
      checkpoint {
        $vm = Get-VM -Id $Config.VmId
        if (Get-VMSnapshot -VM $vm -Name 'ticketsim-baseline' -ErrorAction SilentlyContinue) { throw 'BASELINE_EXISTS' }
        Checkpoint-VM -VM $vm -SnapshotName 'ticketsim-baseline'
      }
      reset {
        $vm = Get-VM -Id $Config.VmId
        $snapshot = @(Get-VMSnapshot -VM $vm | Where-Object { $_.Id.ToString() -eq $Config.CheckpointId })
        if ($snapshot.Count -ne 1) { throw 'BASELINE_MISSING' }
        Restore-VMSnapshot -VMSnapshot $snapshot[0] -Confirm:$false
      }
      backup {
        if (Test-Path -LiteralPath $Config.BackupRoot) { throw 'BACKUP_DESTINATION_EXISTS' }
        if ($Config.BaselineFingerprint -notmatch '^[a-fA-F0-9]{64}$') { throw 'BASELINE_UNVERIFIED' }
        Export-VM -VM (Get-VM -Id $Config.VmId) -Path $Config.BackupRoot
        @{ VmId=$Config.VmId; BaselineFingerprint=$Config.BaselineFingerprint; Files=@(Get-BackupFiles $Config.BackupRoot) } | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $Config.BackupRoot 'integrity.json')
        $null = Assert-LabBackup $Config
      }
      restore-copy {
        if (Test-Path -LiteralPath $Config.DrillRoot) { throw 'DRILL_DESTINATION_EXISTS' }
        $null = Assert-LabBackup $Config
        $vmcx = @(Get-ChildItem -LiteralPath $Config.BackupRoot -Filter '*.vmcx' -Recurse -File | Where-Object { $_.BaseName -eq $Config.VmId -and $_.Directory.Name -eq 'Virtual Machines' })
        if ($vmcx.Count -ne 1) { throw 'AMBIGUOUS_BACKUP' }
        # Compatibility report permits disconnecting all NICs BEFORE import, avoiding conflicts.
        $report = Compare-VM -Path $vmcx[0].FullName -Copy -GenerateNewId -VirtualMachinePath $Config.DrillRoot -VhdDestinationPath $Config.DrillRoot
        $report.VM | Get-VMNetworkAdapter | Disconnect-VMNetworkAdapter
        $copy = Import-VM -CompatibilityReport $report
        if ($copy.Id.ToString() -eq $Config.VmId -or $copy.Id.ToString() -eq $protectedId) { throw 'RESTORE_IDENTITY_INVALID' }
        $record.Result = @{ VmId=$copy.Id.ToString(); Network='disconnected'; Verified=$false }
        Write-LabJournal $requestPath $record
        Rename-VM -VM $copy -NewName 'ticketsim-lab-recovery'
      }
    }
    $record.Status='awaiting-independent-verification'
  } catch { $record.Status='failed-quarantined'; $record.Error=$_.Exception.Message; throw }
  finally { Write-LabJournal $requestPath $record }
  # Deliberately no lease deletion: operator review/verification required after every action.
  return $record
}
Export-ModuleMember -Function Invoke-LabOperator,New-LabPlan,Assert-LabCapacity,Assert-LabBackup,Assert-LabRecovery,Assert-LabRequest
