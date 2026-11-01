# Synthetic fixtures only; no Hyper-V or network commands are executed.
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'HyperV.Operator.psm1') -Force
$temp = Join-Path ([IO.Path]::GetTempPath()) ('ticketsim-operator-tests-' + [guid]::NewGuid())
$null = New-Item -ItemType Directory -Path $temp
try {
  $source = Join-Path $temp 'source.vhdx'; Set-Content -LiteralPath $source -Value 'synthetic-not-a-vhd'
  $config = Get-Content (Join-Path $PSScriptRoot 'operator.example.json') -Raw | ConvertFrom-Json
  $config.DisposableApproved=$true; $config.SourceVhd=$source; $config.SourceSha256=(Get-FileHash $source).Hash
  # Keep synthetic provisioning checks independent of the actual disposable VM path.
  $config.VmRoot=Join-Path $temp 'synthetic-vm-root'; $config.DrillRoot=Join-Path $temp 'synthetic-drill-root'; $config.StateRoot=Join-Path $temp 'synthetic-state-root'
  $config.SwitchMappingVerified=$true; $config.IpAllocationVerified=$true
  $inventory = [pscustomobject]@{ Vms=@(); Vhds=@(); Adapters=@(); Switches=@([pscustomobject]@{ Id=$config.ManagementSwitchId; SwitchType='Internal'; Name='fake-management' },[pscustomobject]@{ Id=$config.NatSwitchId; SwitchType='Internal'; Name='fake-nat' }) }
  function Expect-Reject($Name, $Action, $Code) {
    try { & $Action; throw "Expected rejection: $Name" } catch { if ($_.Exception.Message -notlike "*$Code*") { throw }; Write-Output "PASS $Name" }
  }
  $plan = New-LabPlan $config $inventory provision
  if ($plan.Apply -ne $false) { throw 'DRY_RUN_MUTATED' }; Write-Output 'PASS default dry-run'
  $copy = $config | ConvertTo-Json | ConvertFrom-Json; $copy.Name='lab1'
  Expect-Reject 'protected lab1 name' { New-LabPlan $copy $inventory provision } 'PROTECTED_TARGET'
  $copy.Name='ticketsim-lab'; $copy.VmId='546953dc-48e4-4080-839d-27ad5552ac7d'
  Expect-Reject 'protected lab1 ID' { New-LabPlan $copy $inventory provision } 'PROTECTED_TARGET'
  $inventory.Vms=@([pscustomobject]@{ Name='ticketsim-lab'; Id=[guid]::NewGuid(); State='Off' })
  Expect-Reject 'VM collision' { New-LabPlan $config $inventory provision } 'VM_COLLISION'; $inventory.Vms=@()
  $inventory.Adapters=@([pscustomobject]@{ VMId='another'; MacAddress=$config.ManagementMac; IPAddresses=@() })
  Expect-Reject 'MAC collision' { New-LabPlan $config $inventory provision } 'MAC_COLLISION'
  $inventory.Adapters=@([pscustomobject]@{ VMId='another'; MacAddress='020000000001'; IPAddresses=@($config.ManagementIp) })
  Expect-Reject 'IP collision' { New-LabPlan $config $inventory provision } 'IP_COLLISION'; $inventory.Adapters=@()
  $switches=$inventory.Switches; $inventory.Switches=@()
  Expect-Reject 'missing switch' { New-LabPlan $config $inventory provision } 'SWITCH_UNVERIFIED'; $inventory.Switches=$switches
  $config.BackupRoot=Join-Path $temp 'missing-backup'
  Expect-Reject 'missing backup' { Assert-LabBackup $config } 'BACKUP_MISSING'
  $null=New-Item -ItemType Directory -Path $config.BackupRoot
  @{VmId='wrong'; BaselineFingerprint='x'; Files=@()} | ConvertTo-Json | Set-Content (Join-Path $config.BackupRoot 'integrity.json')
  Expect-Reject 'invalid backup' { Assert-LabBackup $config } 'BACKUP_IDENTITY_INVALID'
  $module = Get-Module HyperV.Operator
  $config.VmId='00000000-0000-4000-8000-000000000009'; $config.BaselineFingerprint=('a' * 64)
  $payload=Join-Path $config.BackupRoot 'disk.bin'; Set-Content -LiteralPath $payload 'synthetic-backup'
  $manifestPath=Join-Path $config.BackupRoot 'integrity.json'
  $manifest=@{VmId=$config.VmId;BaselineFingerprint=$config.BaselineFingerprint;Files=@(@{Path='disk.bin';Hash=(Get-FileHash $payload).Hash})}
  $manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manifestPath
  $null=Assert-LabBackup $config; Write-Output 'PASS exact backup baseline and hash'
  $manifest.BaselineFingerprint=('b' * 64); $manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manifestPath
  Expect-Reject 'wrong backup baseline' { Assert-LabBackup $config } 'BACKUP_IDENTITY_INVALID'
  $manifest.BaselineFingerprint=$config.BaselineFingerprint; $manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manifestPath
  Set-Content -LiteralPath $payload 'changed'
  Expect-Reject 'corrupted backup' { Assert-LabBackup $config } 'BACKUP_HASH_MISMATCH'
  foreach ($unsafe in @('E:\safe\file.vhdx:stream','\\?\E:\safe\file.vhdx','E:\safe\..\other')) {
    Expect-Reject "unsafe path $unsafe" { & $module { param($path) Assert-LabPath $path } $unsafe } 'INVALID_PATH'
  }
  $journal=Join-Path $temp 'append-journal.json'
  & $module { param($path)
    $record=[ordered]@{Status='started'; UpdatedAt=$null}
    Write-LabJournal $path $record -Initial
    $record.Status='failed-quarantined'; Write-LabJournal $path $record
  } $journal
  $rows=@(Get-Content -LiteralPath $journal | ForEach-Object { $_ | ConvertFrom-Json })
  if ($rows.Count -ne 2 -or $rows[0].Status -ne 'started' -or $rows[1].Status -ne 'failed-quarantined') { throw 'JOURNAL_LOST_HISTORY' }
  Write-Output 'PASS append-only journal preserves history'
  $config.BackupRoot='F:\TicketSimBackups\baseline-001'
  & $module {
    function script:Get-CimInstance { [pscustomobject]@{ FreePhysicalMemory=1 } }
  }
  Expect-Reject 'insufficient RAM' { Assert-LabCapacity $config } 'INSUFFICIENT_RAM'
  & $module {
    function script:Get-CimInstance { [pscustomobject]@{ FreePhysicalMemory=100000000 } }
    function script:Get-Volume { param($FilePath) [pscustomobject]@{ UniqueId=$FilePath; SizeRemaining=1 } }
  }
  Expect-Reject 'insufficient storage' { Assert-LabCapacity $config } 'INSUFFICIENT_STORAGE'
  & $module { function script:Get-Volume { [pscustomobject]@{ UniqueId='same-volume'; SizeRemaining=1000GB } } }
  Expect-Reject 'aliased backup volume' { Assert-LabCapacity $config } 'BACKUP_VOLUME_NOT_INDEPENDENT'
  $state=Join-Path $temp 'state'; $null=New-Item -ItemType Directory -Path $state
  Set-Content (Join-Path $state 'request-0001.json') '{}'
  Expect-Reject 'duplicate lifecycle action' { Assert-LabRequest $state 'request-0001' } 'DUPLICATE_REQUEST'
  $null=New-Item -ItemType Directory -Path (Join-Path $state 'exclusive-lease')
  Expect-Reject 'restart quarantine' { Assert-LabRequest $state 'request-0002' } 'LEASE_QUARANTINED'
  $evidence=[pscustomobject]@{VmId='new-copy'; DistinctMacAndIp=$false}
  Expect-Reject 'failed restore verification' { Assert-LabRecovery $config $evidence } 'RESTORE_NOT_VERIFIED'
  $config.BackupRoot='F:\TicketSimBackups\baseline-001'; $config.StateRoot=Join-Path $temp 'mock-apply-state'
  $config.VmId='00000000-0000-4000-8000-000000000009'; $config.CheckpointId='mock-baseline'
  $inventory.Vms=@([pscustomobject]@{Name='ticketsim-lab';Id=[guid]$config.VmId;State='Off'})
  & $module {
    param($inv,$cfg)
    $script:fakeInventory=$inv; $script:fakeConfig=$cfg; $script:restoreCalls=0
    function script:Get-LabInventory { $script:fakeInventory }
    function script:Assert-LabCapacity { }
    function script:Get-VHD { [pscustomobject]@{Size=20GB;ParentPath=$null} }
    function script:Get-VM { [pscustomobject]@{Id=$script:fakeConfig.VmId} }
    function script:Get-VMHardDiskDrive { [pscustomobject]@{Path=(Join-Path $script:fakeConfig.VmRoot 'ubuntu.vhdx')} }
    function script:Get-VMSnapshot { [pscustomobject]@{Id=$script:fakeConfig.CheckpointId} }
    function script:Restore-VMSnapshot { param($VMSnapshot,$Confirm); $script:restoreCalls++ }
  } $inventory $config
  $result=Invoke-LabOperator $config reset 'mock-reset-0001' -Apply -Approval 'APPROVE GATE B reset mock-reset-0001'
  if ($result.Status -ne 'awaiting-independent-verification' -or (& $module { $script:restoreCalls }) -ne 1) { throw 'MOCK_RESET_FAILED' }
  Expect-Reject 'mock reset keeps quarantine' { Assert-LabRequest $config.StateRoot 'mock-reset-0002' } 'LEASE_QUARANTINED'
  Write-Output 'PASS zero Hyper-V mutations (no Hyper-V provider imported)'
} finally {
  $resolved = [IO.Path]::GetFullPath($temp)
  if ($resolved.StartsWith([IO.Path]::GetTempPath()) -and (Split-Path -Leaf $resolved).StartsWith('ticketsim-operator-tests-')) { Remove-Item -LiteralPath $resolved -Recurse -Force }
}
