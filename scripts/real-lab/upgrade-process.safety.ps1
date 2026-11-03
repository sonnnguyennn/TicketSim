$ErrorActionPreference='Stop'
Import-Module (Join-Path $PSScriptRoot 'UpgradeProcess.psm1') -Force
function Assert-Rejected([scriptblock]$Action){$rejected=$false;try{& $Action}catch{$rejected=$true};if(-not $rejected){throw 'Expected rejection'}}
$stamp=[datetime]::UtcNow
$record=[pscustomobject]@{Mode='approved-trial';OperatorPid=100;AgentLauncherPid=200;StartedAt=$stamp.ToString('o')}
$m1=[pscustomobject]@{AgentNodePid=300;Runtime=[pscustomobject]@{startedAt=$stamp.ToString('o')}}
$process=[pscustomobject]@{ProcessId=300;CreationDate=$stamp;ExecutablePath='C:\Program Files\TicketSimPilot\node.exe'}
$arguments=@('C:\Program Files\TicketSimPilot\node.exe','C:\Program Files\TicketSimPilot\agent\pilot.mjs')
$options=@{Process=$process;Arguments=$arguments;Role='Agent';Record=$record;M1=$m1;AgentSid='agent';OperatorSid='operator';OwnerSid='agent'}
Assert-UpgradeProcessIdentity @options
Write-Output 'PASS exact process identity'
# A separate splat ensures a policy rejection, not duplicate-parameter binding.
$wrong=@{};foreach($key in $options.Keys){$wrong[$key]=$options[$key]};$wrong.OwnerSid='operator'
Assert-Rejected {Assert-UpgradeProcessIdentity @wrong}
Write-Output 'PASS different owner rejected'
$wrong.OwnerSid='agent';$wrong.Arguments=@($arguments[0],$arguments[1],'extra')
Assert-Rejected {Assert-UpgradeProcessIdentity @wrong}
Write-Output 'PASS extra command argument rejected'
$process.CreationDate=$stamp.AddMinutes(1)
Assert-Rejected {Assert-UpgradeProcessIdentity @options}
$process.CreationDate=$stamp
Write-Output 'PASS reused PID time rejected'
$parsed=@(ConvertFrom-WindowsCommandLine ('"'+$arguments[0]+'" "'+$arguments[1]+'"'))
if($parsed.Count -ne 2 -or $parsed[0] -cne $arguments[0] -or $parsed[1] -cne $arguments[1]){throw 'Native argument parser mismatch'}
Write-Output 'PASS native Windows argument parser'
# Dry-run must return before touching machine state or invoking privileged APIs.
function Stop-Process {throw 'UNEXPECTED_STOP'}
function Start-Process {throw 'UNEXPECTED_START'}
function New-Item {throw 'UNEXPECTED_WRITE'}
function Copy-Item {throw 'UNEXPECTED_COPY'}
function Start-VM {throw 'UNEXPECTED_VM_BOOT'}
$dry=& (Join-Path $PSScriptRoot 'Upgrade-PilotRuntime.ps1')|ConvertFrom-Json
if($dry.Apply -ne $false){throw 'Dry-run failed'}
$resumeDry=& (Join-Path $PSScriptRoot 'Resume-LockedUpgrade.ps1')|ConvertFrom-Json
if($resumeDry.Apply -ne $false -or $resumeDry.ResumeLocked -ne $true){throw 'Resume dry-run failed'}
$continueDry=& (Join-Path $PSScriptRoot 'Continue-RetiredUpgrade.ps1')|ConvertFrom-Json
if($continueDry.Apply -ne $false){throw 'Retired continuation dry-run failed'}
Assert-Rejected {& (Join-Path $PSScriptRoot 'Continue-RetiredUpgrade.ps1') -Apply -Inspect}
$bootDry=& (Join-Path $PSScriptRoot 'Start-ApprovedRetiredOriginal.ps1')|ConvertFrom-Json
if($bootDry.Apply -ne $false -or $bootDry.VmId -ne '2b9c2170-9a23-4d08-b82e-29929afa4c10'){throw 'Approved boot dry-run failed'}
$repairDry=& (Join-Path $PSScriptRoot 'Restore-ApprovedGuestFirewallBaseline.ps1')|ConvertFrom-Json
if($repairDry.Apply -ne $false -or $repairDry.GuestCommand -ne 'systemctl is-active --quiet firewalld && sudo systemctl stop firewalld'){throw 'Firewall repair dry-run failed'}
Assert-Rejected {& (Join-Path $PSScriptRoot 'Restore-ApprovedGuestFirewallBaseline.ps1') -Apply -Consent 'wrong'}
$confirmDry=& (Join-Path $PSScriptRoot 'Confirm-RepairedBaseline.ps1')|ConvertFrom-Json
if($confirmDry.Record -ne $false){throw 'Read-only reconciliation dry-run failed'}
Write-Output 'PASS dry-run performs no process or filesystem mutation'
foreach($name in @('Upgrade-PilotRuntime.ps1','Resume-LockedUpgrade.ps1','Continue-RetiredUpgrade.ps1','Start-ApprovedRetiredOriginal.ps1','Restore-ApprovedGuestFirewallBaseline.ps1','Confirm-RepairedBaseline.ps1','BootIntegrity.psm1','PilotShell.psm1','Open-Operator.ps1','Get-OperatorToken.ps1','UpgradeProcess.psm1','Verify-M4Runtime.ps1')){
  $tokens=$null;$errors=$null;$null=[Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot $name),[ref]$tokens,[ref]$errors)
  if($errors.Count){throw "Parse failure in $name"}
}
Write-Output 'PASS PowerShell installer syntax'
# Execute the real parameter declaration and record-fetch assignment together,
# without the elevation/protected-state parts. PowerShell's typed parameter
# names are case-insensitive, so -Record must not collide with a record object.
$tokens=$null;$parseErrors=$null
$confirmAst=[Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'Confirm-RepairedBaseline.ps1'),[ref]$tokens,[ref]$parseErrors)
$assignments=@($confirmAst.FindAll({param($node) $node -is [Management.Automation.Language.AssignmentStatementAst] -and $node.Right.Extent.Text -eq 'Get-M4InstallationRecord'},$true))
if($assignments.Count -ne 1){throw 'Expected one installation-record assignment'}
$assignment=$assignments[0];$variableName=$assignment.Left.VariablePath.UserPath
$testText=$confirmAst.ParamBlock.Extent.Text+"`nfunction Get-M4InstallationRecord { [pscustomobject]@{phase='retired';ownerId='synthetic'} }`n"+$assignment.Extent.Text+"`nGet-Variable -Name '$variableName' -ValueOnly"
$actualRecord=& ([scriptblock]::Create($testText)) -Record
if($actualRecord.phase -ne 'retired' -or $actualRecord.ownerId -ne 'synthetic'){throw 'Record switch path failed'}
Write-Output 'PASS Record switch and actual installation-record assignment coexist'
Write-Output 'No actual process, VM, state or backup operation was performed.'
