param(
  [Parameter(Mandatory)][string]$ConfigPath,
  [ValidateSet('provision','checkpoint','reset','backup','restore-copy')][string]$Operation = 'provision',
  [Parameter(Mandatory)][string]$RequestId,
  [switch]$Apply,
  [string]$Approval
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'HyperV.Operator.psm1') -Force
$config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
Invoke-LabOperator -Config $config -Operation $Operation -RequestId $RequestId -Apply:$Apply -Approval $Approval | ConvertTo-Json -Depth 10
