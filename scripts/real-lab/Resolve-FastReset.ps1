param(
  [Parameter(Mandatory)][ValidateSet('checkpoint','start','stop','reset')][string]$Action,
  [Parameter(Mandatory)][string]$RequestId,
  [Parameter(Mandatory)][guid]$CheckpointId,
  [Parameter(Mandatory)][string]$EvidencePath,
  [Parameter(Mandatory)][string]$Approval
)
$ErrorActionPreference = 'Stop'
if ($RequestId -notmatch '^[a-zA-Z0-9-]{8,64}$' -or $Approval -cne "APPROVE B5 reconcile $RequestId") { throw 'RECONCILIATION_APPROVAL_REQUIRED' }
$root = 'E:\TicketSimOperatorState\b5'
$lease = Join-Path $root 'exclusive-lease'
$journal = Join-Path $root "$RequestId.ndjson"
if (-not (Test-Path -LiteralPath $lease -PathType Leaf) -or -not (Test-Path -LiteralPath $journal -PathType Leaf)) { throw 'LEASE_OR_JOURNAL_MISSING' }
$records = @(Get-Content -LiteralPath $journal -ErrorAction Stop | ForEach-Object { $_ | ConvertFrom-Json -ErrorAction Stop })
$last = $records[-1]
if ($last.RequestId -ne $RequestId -or $last.Action -ne $Action -or $last.VmId -ne '2b9c2170-9a23-4d08-b82e-29929afa4c10' -or $last.Status -ne 'awaiting-independent-verification') { throw 'JOURNAL_NOT_RECONCILABLE' }
if ($Action -eq 'checkpoint' -and $last.Result.CheckpointId -ne $CheckpointId.ToString() -or $Action -ne 'checkpoint' -and $last.CheckpointId -ne $CheckpointId.ToString()) { throw 'CHECKPOINT_ID_MISMATCH' }
$evidence = Get-Content -LiteralPath $EvidencePath -Raw -ErrorAction Stop | ConvertFrom-Json -ErrorAction Stop
if ($evidence.RequestId -ne $RequestId -or $evidence.Action -ne $Action -or $evidence.VmId -ne $last.VmId -or $evidence.CheckpointId -ne $CheckpointId.ToString() -or $evidence.Verified -ne $true -or $evidence.NoOtherVmChanged -ne $true -or $evidence.BackupUnchanged -ne $true) { throw 'INDEPENDENT_EVIDENCE_INVALID' }
$vms = @(Get-VM -ErrorAction Stop)
$target = @($vms | Where-Object { $_.Id -eq ([guid]'2b9c2170-9a23-4d08-b82e-29929afa4c10') })
$recovery = @($vms | Where-Object { $_.Id -eq ([guid]'463dddf4-6e47-47b7-a39f-5b5d7ef84df0') })
$protected = @($vms | Where-Object { $_.Id -eq ([guid]'546953dc-48e4-4080-839d-27ad5552ac7d') })
if ($target.Count -ne 1 -or $recovery.Count -ne 1 -or $protected.Count -ne 1 -or $target[0].Name -ne 'ticketsim-lab' -or $recovery[0].Name -ne 'ticketsim-lab-recovery' -or $protected[0].Name -ne 'lab1') { throw 'VM_IDENTITY_MISMATCH' }
$snapshots = @(Get-VMSnapshot -VM $target[0] -ErrorAction Stop)
if ($snapshots.Count -ne 1 -or $snapshots[0].Id -ne $CheckpointId -or $snapshots[0].Name -ne 'ticketsim-lab-b5-clean-baseline-v1') { throw 'CHECKPOINT_ID_MISMATCH' }
$expectedState = if ($Action -eq 'start') { 'Running' } else { 'Off' }
if ($target[0].State.ToString() -ne $expectedState) { throw 'TARGET_STATE_MISMATCH' }
if ($Action -eq 'start' -and $recovery[0].State -ne 'Off') { throw 'RECOVERY_VM_RUNNING' }
Import-Module (Join-Path $PSScriptRoot 'FastReset.Operator.psm1') -Force
$null = Assert-FastResetBackup
$record = [ordered]@{ RequestId=$RequestId; Action=$Action; VmId=$last.VmId; CheckpointId=$CheckpointId.ToString(); Status='reconciled'; UpdatedAt=[DateTime]::UtcNow.ToString('o'); EvidencePath=$EvidencePath }
$bytes=[Text.Encoding]::UTF8.GetBytes(($record | ConvertTo-Json -Compress)+"`n")
$stream=[IO.FileStream]::new($journal,[IO.FileMode]::Append,[IO.FileAccess]::Write,[IO.FileShare]::Read)
try { $stream.Write($bytes,0,$bytes.Length); $stream.Flush($true) } finally { $stream.Dispose() }
[IO.File]::Delete($lease)
$record | ConvertTo-Json -Depth 5
