param([switch]$Apply)
$ErrorActionPreference='Stop'
# Explicit reviewed recovery branch; does not remove an old record or gate.
& (Join-Path $PSScriptRoot 'Upgrade-PilotRuntime.ps1') -ResumeLocked -Apply:$Apply
