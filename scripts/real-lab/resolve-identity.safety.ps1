# Exercise only the resolver's identity filters/guard, never its file or host operations.
$ErrorActionPreference='Stop'
if($PSVersionTable.PSVersion.Major -ne 5 -or $PSVersionTable.PSVersion.Minor -ne 1){throw 'WINDOWS_POWERSHELL_51_REQUIRED'}
$ids=@('2b9c2170-9a23-4d08-b82e-29929afa4c10','463dddf4-6e47-47b7-a39f-5b5d7ef84df0','546953dc-48e4-4080-839d-27ad5552ac7d')
$fixtures=@([pscustomobject]@{Id=[guid]$ids[0];Name='ticketsim-lab'},[pscustomobject]@{Id=[guid]$ids[1];Name='ticketsim-lab-recovery'},[pscustomobject]@{Id=[guid]$ids[2];Name='lab1'})
function Capture-Argument($Value){return $Value}
$literal=Capture-Argument [guid]'2b9c2170-9a23-4d08-b82e-29929afa4c10'
if($literal -isnot [string] -or $literal -cne '[guid]2b9c2170-9a23-4d08-b82e-29929afa4c10'){throw 'ARGUMENT_MODE_REPRO_FAILED'}
$broken=@($fixtures|Where-Object Id -eq [guid]'2b9c2170-9a23-4d08-b82e-29929afa4c10')
if($broken.Count -ne 0){throw 'ORIGINAL_FILTER_DID_NOT_REPRODUCE'}
Write-Output 'PASS PS5.1 literal cast-token reproduces zero matches'

$tokens=$null;$errors=$null
$ast=[Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'Resolve-FastReset.ps1'),[ref]$tokens,[ref]$errors)
if($errors.Count){throw 'RESOLVER_PARSE_FAILED'}
$parts=@()
foreach($name in @('target','recovery','protected')){
  $nodes=@($ast.FindAll({param($node) $node -is [Management.Automation.Language.AssignmentStatementAst] -and $node.Left -is [Management.Automation.Language.VariableExpressionAst] -and $node.Left.VariablePath.UserPath -eq $name},$true))
  if($nodes.Count -ne 1){throw 'IDENTITY_FILTER_NOT_UNIQUE'}
  $parts+=$nodes[0].Extent.Text
}
$guards=@($ast.FindAll({param($node) $node -is [Management.Automation.Language.IfStatementAst] -and $node.Extent.Text.Contains("throw 'VM_IDENTITY_MISMATCH'")},$true))
if($guards.Count -ne 1){throw 'IDENTITY_GUARD_NOT_UNIQUE'}
# Evaluate the actual three source assignments plus their unchanged count/name guard.
$code=[scriptblock]::Create(($parts -join "`n")+"`n"+$guards[0].Extent.Text+"`n"+'@($target.Count,$recovery.Count,$protected.Count)')
function Check-Identity($items){ & {param($vms,$testCode) & $testCode} $items $code }
$counts=@(Check-Identity $fixtures)
if(($counts -join ',') -cne '1,1,1'){throw 'FIXED_FILTER_COUNTS_INVALID'}
Write-Output 'PASS actual resolver filters match all three typed GUIDs'
function Reject($label,$items){
  $rejected=$false
  try{Check-Identity $items|Out-Null}catch{if($_.Exception.Message -ne 'VM_IDENTITY_MISMATCH'){throw};$rejected=$true}
  if(-not $rejected){throw "IDENTITY_GUARD_ACCEPTED_$label"}
  Write-Output "PASS $label rejected"
}
Reject 'missing VM' @($fixtures[0],$fixtures[1])
Reject 'duplicate immutable ID' @($fixtures[0],$fixtures[1],$fixtures[2],$fixtures[0])
$wrongName=@($fixtures|ForEach-Object {[pscustomobject]@{Id=$_.Id;Name=$_.Name}});$wrongName[0].Name='other-vm'
Reject 'wrong exact name' $wrongName
$wrongId=@($fixtures|ForEach-Object {[pscustomobject]@{Id=$_.Id;Name=$_.Name}});$wrongId[0].Id=[guid]::NewGuid()
Reject 'wrong immutable ID' $wrongId
Write-Output 'PASS no reconciliation execution or Hyper-V calls'
