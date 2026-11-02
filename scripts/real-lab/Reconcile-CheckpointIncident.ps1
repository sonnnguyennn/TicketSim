param(
  [Parameter(Mandatory)][string]$RequestId,
  [Parameter(Mandatory)][string]$VmId,
  [Parameter(Mandatory)][string]$CheckpointId,
  [switch]$Apply,
  [string]$Approval=''
)
$ErrorActionPreference='Stop'
Import-Module (Join-Path $PSScriptRoot 'CheckpointIncident.psm1') -Force
Invoke-CheckpointIncident -RequestId $RequestId -VmId $VmId -CheckpointId $CheckpointId -Apply:$Apply -Approval $Approval | ConvertTo-Json -Depth 6
