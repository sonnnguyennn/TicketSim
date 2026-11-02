$ErrorActionPreference='Stop'
Import-Module (Join-Path $PSHOME 'Modules\Microsoft.PowerShell.Utility\Microsoft.PowerShell.Utility.psd1') -Force
Import-Module (Join-Path $PSScriptRoot 'CheckpointIncident.psm1') -Force
$module=Get-Module CheckpointIncident
$temp=Join-Path ([IO.Path]::GetTempPath()) ('ticketsim-incident-tests-'+[guid]::NewGuid())
$null=New-Item -ItemType Directory -Path $temp
$script:assertions=0
function Pass($label){$script:assertions++;Write-Output "PASS $label"}
function Write-FixtureJson($path,$value){[IO.File]::WriteAllText($path,($value|ConvertTo-Json -Depth 8 -Compress),[Text.UTF8Encoding]::new($false))}
function Fixture {
  $ctx=& $module {Get-IncidentContext}
  $ctx.Journal=Join-Path $temp 'request.ndjson';$ctx.Evidence=Join-Path $temp 'evidence.json';$ctx.Lease=Join-Path $temp 'exclusive-lease';$ctx.Archive=Join-Path $temp 'archive'
  foreach($path in @($ctx.Lease,$ctx.Archive)){if(Test-Path -LiteralPath $path){Remove-Item -LiteralPath $path}}
  [IO.File]::WriteAllBytes($ctx.Lease,[byte[]]@())
  $lease=Get-Item -LiteralPath $ctx.Lease;$ctx.LeaseCreated=$lease.CreationTimeUtc.ToString('o');$lease.LastWriteTimeUtc=$lease.CreationTimeUtc
  $rows=@([ordered]@{RequestId=$ctx.RequestId;Action='checkpoint';VmId=$ctx.VmId;CheckpointId=$null;Status='quarantined';Result=$null;Error=$null},[ordered]@{RequestId=$ctx.RequestId;Action='checkpoint';VmId=$ctx.VmId;CheckpointId=$null;Status='failed-quarantined';Result=$null;Error='CHECKPOINT_POSTCHECK_FAILED'})
  [IO.File]::WriteAllText($ctx.Journal,(($rows|ForEach-Object {$_|ConvertTo-Json -Compress}) -join "`n")+"`n",[Text.UTF8Encoding]::new($false))
  $e=[pscustomobject]@{RequestId=$ctx.RequestId;VmId=$ctx.VmId;State='Off';CheckpointId=$ctx.CheckpointId;CheckpointName=$ctx.Name;CheckpointType='Standard';CreatedAt='2026-11-02T16:35:40.7384490Z';SnapshotCount=1;BackupHashesValid=$true;DiskChain=@([pscustomobject]@{Path=$ctx.Disk;ParentPath=$ctx.Parent;FileSize=4MB});LeaseRetained=$true;Qualification='NOT_RUN';OriginalFailure='CHECKPOINT_POSTCHECK_FAILED; preserved without retry'}
  Write-FixtureJson $ctx.Evidence $e
  $ctx.JournalHash=(Get-FileHash $ctx.Journal).Hash;$ctx.EvidenceHash=(Get-FileHash $ctx.Evidence).Hash
  $obs=[pscustomobject]@{VmId=$ctx.VmId;State='Off';RecoveryState='Off';ProtectedState='Off';ProtectedFingerprint='stable-synthetic-lab1';Snapshots=@([pscustomobject]@{Id=$ctx.CheckpointId;VMId=$ctx.VmId;Name=$ctx.Name;Type='Standard';CreatedAt=$e.CreatedAt});Disks=@([pscustomobject]@{Path=$ctx.Disk;ParentPath=$ctx.Parent;FileSize=4MB})}
  & $module {param($o) $script:observed=$o;$script:backupBad=$false;function script:Get-IncidentObservation {$script:observed};function script:Confirm-IncidentBackup {if($script:backupBad){throw 'BACKUP_HASH_MISMATCH'}}} $obs
  return $ctx
}
function Reject($label,$ctx,$work){
  $hash=(Get-FileHash $ctx.Journal).Hash
  $rejected=$false;try{& $work|Out-Null}catch{$rejected=$true}
  if(-not $rejected){throw "ACCEPTED_UNSAFE_$label"}
  if(-not(Test-Path -LiteralPath $ctx.Lease) -or (Test-Path -LiteralPath $ctx.Archive) -or (Get-FileHash $ctx.Journal).Hash -ne $hash){throw "LOST_QUARANTINE_$label"}
  Pass $label
}
try {
  $ctx=Fixture
  $plan=& $module {param($c) Invoke-IncidentCore $c} $ctx
  if($plan.Applied -or $plan.Validation -ne 'PASS'){throw 'PLAN_FAILED'};Pass 'correct incident read-only'
  foreach($field in @('RequestId','VmId','CheckpointId')){
    $ctx=Fixture;$request=$ctx.RequestId;$vm=$ctx.VmId;$checkpoint=$ctx.CheckpointId
    if($field -eq 'RequestId'){$request='wrong-request'}elseif($field -eq 'VmId'){$vm='546953dc-48e4-4080-839d-27ad5552ac7d'}else{$checkpoint='00000000-0000-4000-8000-000000000002'}
    Reject "wrong $field" $ctx {Invoke-CheckpointIncident $request $vm $checkpoint}
  }
  foreach($change in @('missing-marker','wrong-action','additional-snapshot','wrong-parent','backup-hash','recovery-running','missing-evidence','invalid-evidence','wrong-type','lease-mismatch','no-approval')) {
    $ctx=Fixture
    switch($change){
      missing-marker {$text=(Get-Content $ctx.Journal -Raw).Replace('CHECKPOINT_POSTCHECK_FAILED','OTHER_ERROR');[IO.File]::WriteAllText($ctx.Journal,$text);$ctx.JournalHash=(Get-FileHash $ctx.Journal).Hash}
      wrong-action {$text=(Get-Content $ctx.Journal -Raw).Replace('checkpoint','reset');[IO.File]::WriteAllText($ctx.Journal,$text);$ctx.JournalHash=(Get-FileHash $ctx.Journal).Hash}
      additional-snapshot {& $module {$script:observed.Snapshots+= $script:observed.Snapshots[0]}}
      wrong-parent {& $module {$script:observed.Disks[0].ParentPath='E:\wrong.vhdx'}}
      backup-hash {& $module {$script:backupBad=$true}}
      recovery-running {& $module {$script:observed.RecoveryState='Running'}}
      missing-evidence {Remove-Item -LiteralPath $ctx.Evidence}
      invalid-evidence {$e=Get-Content $ctx.Evidence -Raw|ConvertFrom-Json;$e.CheckpointId='wrong';Write-FixtureJson $ctx.Evidence $e;$ctx.EvidenceHash=(Get-FileHash $ctx.Evidence).Hash}
      wrong-type {& $module {$script:observed.Snapshots[0].Type='Production'}}
      lease-mismatch {[IO.File]::WriteAllText($ctx.Lease,'different-owner')}
    }
    if($change -eq 'no-approval'){Reject $change $ctx {& $module {param($c) Invoke-IncidentCore $c -Apply -Approval 'wrong'} $ctx}}
    else{Reject $change $ctx {& $module {param($c) Invoke-IncidentCore $c} $ctx}}
  }
  $ctx=Fixture;$original=[IO.File]::ReadAllBytes($ctx.Journal)
  $result=& $module {param($c) Invoke-IncidentCore $c -Apply -Approval "APPROVE B5 checkpoint-incident-reconcile $($c.RequestId) $($c.CheckpointId)"} $ctx
  $after=[IO.File]::ReadAllBytes($ctx.Journal)
  if(-not $result.Applied -or (Test-Path $ctx.Lease) -or -not(Test-Path $ctx.Archive) -or [Convert]::ToBase64String($after[0..($original.Length-1)]) -ne [Convert]::ToBase64String($original)){throw 'APPEND_OR_RELEASE_FAILED'}
  $rows=@(Get-Content $ctx.Journal|ForEach-Object {$_|ConvertFrom-Json})
  if($rows.Count -ne 3 -or $rows[1].Status -ne 'failed-quarantined' -or $null -ne $rows[1].Result -or $rows[2].Event -ne 'checkpoint-incident-reconciled'){throw 'HISTORY_CHANGED'}
  Pass 'approved append preserves failed history and archives exact lease'
  $hash=(Get-FileHash $ctx.Journal).Hash;$duplicate=$false
  try{& $module {param($c) Invoke-IncidentCore $c -Apply -Approval "APPROVE B5 checkpoint-incident-reconcile $($c.RequestId) $($c.CheckpointId)"} $ctx|Out-Null}catch{$duplicate=$true}
  if(-not $duplicate -or (Get-FileHash $ctx.Journal).Hash -ne $hash){throw 'DUPLICATE_CHANGED_HISTORY'}
  Pass 'duplicate rejected'
  Write-Output "ASSERTIONS $script:assertions; zero real Hyper-V calls"
} finally {
  $full=[IO.Path]::GetFullPath($temp)
  if($full.StartsWith([IO.Path]::GetTempPath()) -and (Split-Path -Leaf $full).StartsWith('ticketsim-incident-tests-')){Remove-Item -LiteralPath $full -Recurse -Force}
}
