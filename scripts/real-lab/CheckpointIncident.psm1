Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'

function Get-IncidentContext {
  $root='E:\TicketSimOperatorState\b5'
  [pscustomobject]@{
    RequestId='b5-offline-baseline-20261102-001'; VmId='2b9c2170-9a23-4d08-b82e-29929afa4c10'
    CheckpointId='e6d04330-142c-4397-8e0d-ddf5a9e69090'; Name='ticketsim-lab-b5-clean-baseline-v1'
    Journal=(Join-Path $root 'b5-offline-baseline-20261102-001.ndjson')
    Evidence=(Join-Path $root 'checkpoint-independent-verification-20261102.json')
    Lease=(Join-Path $root 'exclusive-lease')
    Archive=(Join-Path $root 'b5-offline-baseline-20261102-001.incident-reconciled-lease')
    JournalHash='79B389327DE4D005727B202897B8A446A2A2CAE4DB6997E6E7444C20CF9BC9F6'
    EvidenceHash='EAFEA35DBD2515A9AB67F4DBC7C7F4A2E7724EE83F0DCA3460D39BD0C39D37B3'
    LeaseCreated='2026-11-02T16:35:14.6073575Z'
    Disk='E:\TicketSimVMs\ticketsim-lab\ubuntu_889C27B4-BDC5-40AC-B58E-5615339AA4CB.avhdx'
    Parent='E:\TicketSimVMs\ticketsim-lab\ubuntu.vhdx'
  }
}

function Get-IncidentObservation {
  $vms=@(Get-VM -ErrorAction Stop)
  $result=@{}
  foreach($pair in @(@('Target','2b9c2170-9a23-4d08-b82e-29929afa4c10','ticketsim-lab'),@('Recovery','463dddf4-6e47-47b7-a39f-5b5d7ef84df0','ticketsim-lab-recovery'),@('Protected','546953dc-48e4-4080-839d-27ad5552ac7d','lab1'))) {
    $found=@($vms|Where-Object {$_.Id.ToString() -eq $pair[1] -and $_.Name -eq $pair[2]})
    if($found.Count -ne 1){throw 'INCIDENT_VM_IDENTITY_INVALID'}
    $result[$pair[0]]=$found[0]
  }
  $vm=$result.Target
  $snaps=@(Get-VMSnapshot -VM $vm -ErrorAction Stop)
  $disks=@(Get-VMHardDiskDrive -VM $vm -ErrorAction Stop|ForEach-Object {Get-VHD -Path $_.Path -ErrorAction Stop}|Select-Object Path,ParentPath,FileSize)
  # Stable protected VM settings, disk attachments/chains and checkpoints, read only.
  $p=$result.Protected
  $protected=[ordered]@{
    VM=($p|Select-Object Id,Name,State,Generation,ProcessorCount,MemoryStartup,DynamicMemoryEnabled,AutomaticStartAction,AutomaticStopAction)
    Disks=@(Get-VMHardDiskDrive -VM $p -ErrorAction Stop|Sort-Object Path|Select-Object Path,ControllerNumber,ControllerLocation)
    Snapshots=@(Get-VMSnapshot -VM $p -ErrorAction Stop|Sort-Object Id|Select-Object Id,Name,ParentSnapshotId)
  }
  [pscustomobject]@{VmId=$vm.Id.ToString();State=$vm.State.ToString();RecoveryState=$result.Recovery.State.ToString();ProtectedState=$p.State.ToString();Snapshots=@($snaps|Select-Object Id,VMId,Name,@{n='Type';e={$_.SnapshotType.ToString()}},@{n='CreatedAt';e={$_.CreationTime.ToUniversalTime().ToString('o')}});Disks=$disks;ProtectedFingerprint=($protected|ConvertTo-Json -Depth 8 -Compress)}
}

function Confirm-IncidentBackup {
  Import-Module (Join-Path $PSScriptRoot 'FastReset.Operator.psm1') -Force
  if((Assert-FastResetBackup) -ne $true){throw 'INCIDENT_BACKUP_UNKNOWN'}
}

function Assert-IncidentFiles($Context,$JournalStream) {
  foreach($path in @($Context.Journal,$Context.Evidence,$Context.Lease)) {
    $item=Get-Item -LiteralPath $path -ErrorAction Stop
    if($item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'INCIDENT_FILE_INVALID'}
  }
  if(Test-Path -LiteralPath $Context.Archive){throw 'INCIDENT_ALREADY_RECONCILED'}
  if($JournalStream.Length -gt 65536){throw 'INCIDENT_JOURNAL_INVALID'}
  $raw=[byte[]]::new([int]$JournalStream.Length);$null=$JournalStream.Seek(0,[IO.SeekOrigin]::Begin)
  if($JournalStream.Read($raw,0,$raw.Length) -ne $raw.Length){throw 'INCIDENT_JOURNAL_READ_FAILED'}
  $sha=[Security.Cryptography.SHA256]::Create()
  try{$hash=[BitConverter]::ToString($sha.ComputeHash($raw)).Replace('-','')}finally{$sha.Dispose()}
  if($hash -ne $Context.JournalHash){throw 'INCIDENT_JOURNAL_CHANGED'}
  if((Get-FileHash -LiteralPath $Context.Evidence -Algorithm SHA256).Hash -ne $Context.EvidenceHash){throw 'INCIDENT_EVIDENCE_CHANGED'}
  $lease=Get-Item -LiteralPath $Context.Lease
  if($lease.Length -ne 0 -or $lease.CreationTimeUtc.ToString('o') -ne $Context.LeaseCreated -or $lease.LastWriteTimeUtc.ToString('o') -ne $Context.LeaseCreated){throw 'INCIDENT_LEASE_BINDING_INVALID'}
  $rows=@([Text.Encoding]::UTF8.GetString($raw).TrimEnd("`r","`n") -split "`n"|ForEach-Object {$_|ConvertFrom-Json -ErrorAction Stop})
  if($rows.Count -ne 2){throw 'INCIDENT_JOURNAL_INVALID'}
  foreach($row in $rows){
    if($row.RequestId -cne $Context.RequestId -or $row.VmId -cne $Context.VmId -or $row.Action -cne 'checkpoint' -or $null -ne $row.Result -or $null -ne $row.CheckpointId){throw 'INCIDENT_JOURNAL_INVALID'}
  }
  if($rows[0].Status -cne 'quarantined' -or $rows[1].Status -cne 'failed-quarantined' -or $rows[1].Error -cne 'CHECKPOINT_POSTCHECK_FAILED'){throw 'INCIDENT_MARKER_MISSING'}
  return (Get-Content -LiteralPath $Context.Evidence -Raw|ConvertFrom-Json -ErrorAction Stop)
}

function Assert-IncidentObservation($Context,$Evidence,$Observed) {
  if($Observed.VmId -cne $Context.VmId -or $Observed.State -cne 'Off' -or $Observed.RecoveryState -cne 'Off' -or $Observed.ProtectedState -cne 'Off' -or -not $Observed.ProtectedFingerprint){throw 'INCIDENT_VM_STATE_INVALID'}
  $s=@($Observed.Snapshots)
  if($s.Count -ne 1 -or $s[0].Id.ToString() -cne $Context.CheckpointId -or $s[0].VMId.ToString() -cne $Context.VmId -or $s[0].Name -cne $Context.Name -or $s[0].Type -cne 'Standard'){throw 'INCIDENT_SNAPSHOT_INVALID'}
  $d=@($Observed.Disks)
  if($d.Count -ne 1 -or $d[0].Path -ine $Context.Disk -or $d[0].ParentPath -ine $Context.Parent -or $d[0].FileSize -ne 4MB){throw 'INCIDENT_CHAIN_INVALID'}
  if($Evidence.RequestId -cne $Context.RequestId -or $Evidence.VmId -cne $Context.VmId -or $Evidence.CheckpointId -cne $Context.CheckpointId -or $Evidence.State -cne 'Off' -or $Evidence.CheckpointName -cne $Context.Name -or $Evidence.CheckpointType -cne 'Standard' -or $Evidence.SnapshotCount -ne 1 -or $Evidence.BackupHashesValid -ne $true -or $Evidence.LeaseRetained -ne $true -or $Evidence.Qualification -cne 'NOT_RUN' -or $Evidence.OriginalFailure -cne 'CHECKPOINT_POSTCHECK_FAILED; preserved without retry' -or [DateTimeOffset]::Parse($Evidence.CreatedAt) -ne [DateTimeOffset]::Parse($s[0].CreatedAt)){throw 'INCIDENT_EVIDENCE_INVALID'}
  if(@($Evidence.DiskChain).Count -ne 1 -or $Evidence.DiskChain[0].Path -ine $d[0].Path -or $Evidence.DiskChain[0].ParentPath -ine $d[0].ParentPath -or $Evidence.DiskChain[0].FileSize -ne $d[0].FileSize){throw 'INCIDENT_EVIDENCE_INVALID'}
}

function Invoke-IncidentCore($Context,[switch]$Apply,[string]$Approval) {
  if($Apply -and $Approval -cne "APPROVE B5 checkpoint-incident-reconcile $($Context.RequestId) $($Context.CheckpointId)"){throw 'INCIDENT_APPROVAL_REQUIRED'}
  # Hold the exact old lease and journal across validation and append; never create a missing lease.
  $lease=[IO.FileStream]::new($Context.Lease,[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::Delete)
  $journal=$null
  try {
    $journal=[IO.FileStream]::new($Context.Journal,[IO.FileMode]::Open,[IO.FileAccess]::ReadWrite,[IO.FileShare]::Read)
    $evidence=Assert-IncidentFiles $Context $journal
    $before=Get-IncidentObservation
    Assert-IncidentObservation $Context $evidence $before
    Confirm-IncidentBackup
    $after=Get-IncidentObservation
    Assert-IncidentObservation $Context $evidence $after
    if($before.ProtectedFingerprint -cne $after.ProtectedFingerprint){throw 'INCIDENT_PROTECTED_VM_CHANGED'}
    $null=Assert-IncidentFiles $Context $journal
    $result=[ordered]@{RequestId=$Context.RequestId;VmId=$Context.VmId;CheckpointId=$Context.CheckpointId;Validation='PASS';Applied=$false;Journal=$Context.Journal;Lease=$Context.Lease;Evidence=$Context.Evidence;OriginalClassification='failed-quarantined checkpoint / CHECKPOINT_POSTCHECK_FAILED / Result=null';Backup='four pinned sizes and hashes verified';ProtectedVm='Off; stable read-only fingerprint across validation; no VM mutation commands';ExpectedEvent='checkpoint-incident-reconciled';ExpectedLeaseArchive=$Context.Archive}
    if($Apply){
      $event=[ordered]@{Event='checkpoint-incident-reconciled';RequestId=$Context.RequestId;VmId=$Context.VmId;CheckpointId=$Context.CheckpointId;OriginalStatus='failed-quarantined';OriginalError='CHECKPOINT_POSTCHECK_FAILED';OriginalJournalSha256=$Context.JournalHash;EvidenceSha256=$Context.EvidenceHash;Approval=$Approval;OccurredAt=[DateTime]::UtcNow.ToString('o');LeaseTransition='exclusive-lease to retained incident archive'}
      $bytes=[Text.Encoding]::UTF8.GetBytes(($event|ConvertTo-Json -Compress)+"`n")
      $null=$journal.Seek(0,[IO.SeekOrigin]::End);$journal.Write($bytes,0,$bytes.Length);$journal.Flush($true)
      # Atomic no-overwrite rename retains the lease artifact. Failure leaves quarantine; no retry.
      [IO.File]::Move($Context.Lease,$Context.Archive)
      $result.Applied=$true
    }
    return [pscustomobject]$result
  } finally {if($journal){$journal.Dispose()};$lease.Dispose()}
}

function Invoke-CheckpointIncident([string]$RequestId,[string]$VmId,[string]$CheckpointId,[switch]$Apply,[string]$Approval) {
  $context=Get-IncidentContext
  if($RequestId -cne $context.RequestId -or $VmId -cne $context.VmId -or $CheckpointId -cne $context.CheckpointId){throw 'INCIDENT_BINDING_INVALID'}
  Invoke-IncidentCore $context -Apply:$Apply -Approval $Approval
}
Export-ModuleMember -Function Invoke-CheckpointIncident
