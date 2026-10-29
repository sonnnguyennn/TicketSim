param(
  [ValidateSet('provision', 'backup', 'restore-drill')][string]$Operation = 'provision',
  [string]$VmName = 'ticketsim-lab'
)

# Plan emitter only. No execution mode exists in Phase 1B-0.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if ($VmName -ne 'ticketsim-lab') { throw 'Only the future dedicated ticketsim-lab target may be planned.' }
$steps = @{
  provision = @('Confirm operator approval and CPU/RAM/storage budget', 'Inventory existing switch IDs/types and NIC mapping', 'Reserve a distinct unused management IP; never duplicate lab1', 'Review image and direct Hyper-V ownership', 'Plan dual NIC configuration, SSH host identity and console access', 'Record new immutable VM ID and baseline after later approved provisioning')
  backup = @('Confirm dedicated immutable VM ID and sole controller', 'Choose independent storage and sufficient headroom', 'Review consistent export method and retention', 'Record disk set, timestamp, integrity evidence and baseline fingerprint')
  'restore-drill' = @('Confirm operator approval for the dedicated disposable target', 'Verify independent backup identity and integrity', 'Review host-owned recovery procedure with guest SSH unavailable', 'Verify restored VM identity, management, SSH host key and HTTP baseline', 'Record dated recovery proof; keep failed or unknown lease quarantined')
}
[ordered]@{
  schemaVersion = 1; mode = 'plan-only'; operation = $Operation; targetName = $VmName
  executable = $false; ready = $false; steps = $steps[$Operation]
  unresolved = @('Operator approval', 'Dedicated immutable VM identity', 'Verified switch mapping and unique IP', 'Independent backup and successful restore proof', 'Reviewed privilege helper and allowlisted actions')
} | ConvertTo-Json -Depth 5
