param(
  [Parameter(Mandatory)][ValidateSet('checkpoint','start','stop','reset')][string]$Action,
  [Parameter(Mandatory)][string]$RequestId,
  [string]$CheckpointId = '',
  [string]$StateRoot = 'E:\TicketSimOperatorState\b5',
  [switch]$Apply,
  [string]$Approval = ''
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'FastReset.Operator.psm1') -Force
Invoke-FastResetOperator -Action $Action -RequestId $RequestId -CheckpointId $CheckpointId -StateRoot $StateRoot -Apply:$Apply -Approval $Approval | ConvertTo-Json -Depth 8
