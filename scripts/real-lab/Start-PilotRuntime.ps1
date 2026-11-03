param([ValidateSet('Agent','Operator','Both')][string]$Role='Both')
$ErrorActionPreference='Stop'
$install='C:\Program Files\TicketSimPilot'
$state='C:\ProgramData\TicketSimPilot'
$node="$install\node.exe"
$pwsh="$install\powershell\pwsh.exe"
$env:TICKETSIM_TERMINAL_ONLY='1'
$env:TICKETSIM_PWSH=$pwsh
$env:PSModulePath="$install\powershell\Modules;$env:WINDIR\System32\WindowsPowerShell\v1.0\Modules;$env:ProgramFiles\WindowsPowerShell\Modules"
[Environment]::SetEnvironmentVariable('NODE_OPTIONS',$null,'Process')
[Environment]::SetEnvironmentVariable('NODE_PATH',$null,'Process')
if($Role -eq 'Agent') {
  & "$install\scripts\real-lab\Verify-PilotIdentity.ps1" -Role Agent
  if($LASTEXITCODE){throw 'AGENT_IDENTITY_CHECK_FAILED'}
  & $node "$install\agent\pilot.mjs"
  exit $LASTEXITCODE
}
if(-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){throw 'OPERATOR_ELEVATION_REQUIRED'}
$preparation=Get-Content "$state\operator\preparation.json" -Raw | ConvertFrom-Json
if(-not $preparation.CodeHashes){throw 'REFRESH_PREPARED_RUNTIME_BEFORE_LAUNCH'}
foreach($property in $preparation.CodeHashes.PSObject.Properties){if((Get-FileHash -LiteralPath (Join-Path $install $property.Name) -Algorithm SHA256).Hash -ne $property.Value){throw 'PROTECTED_CODE_HASH_CHANGED'}}
& "$install\scripts\real-lab\Verify-PilotIdentity.ps1" -Role Operator
$env:TICKETSIM_LIVE_APPROVAL="$state\operator\approval.DRAFT.json"
$env:TICKETSIM_OPERATOR_TOKEN=[IO.File]::ReadAllText("$state\shared\bridge-token").Trim()
$env:TICKETSIM_OPERATOR_DB="$state\operator\actions.sqlite"
if($Role -eq 'Operator'){& $node "$install\operator\server.mjs";exit $LASTEXITCODE}
if(@(Get-CimInstance Win32_Process | Where-Object {$_.ExecutablePath -eq $node}).Count){throw 'PILOT_ALREADY_RUNNING: inspect existing processes; do not duplicate'}
$credential=Get-Credential -UserName "$env:COMPUTERNAME\TicketSimAgent" -Message 'Windows Agent account password (not SSH); kept only in this launch process'
$probe=Start-Process -FilePath $pwsh -WorkingDirectory $install -Credential $credential -LoadUserProfile -ArgumentList @('-NoProfile','-File',"`"$install\scripts\real-lab\Verify-PilotIdentity.ps1`"",'-Role','Agent') -WindowStyle Hidden -PassThru -Wait -RedirectStandardOutput "$state\agent\identity-probe.stdout" -RedirectStandardError "$state\agent\identity-probe.stderr"
if($probe.ExitCode -ne 0){throw "AGENT_IDENTITY_PROBE_FAILED: inspect $state\agent\identity-probe.stderr"}
$agentEvidence=Get-Content "$state\agent\identity-evidence.json" -Raw | ConvertFrom-Json
if($agentEvidence.Pass -ne $true){throw 'AGENT_IDENTITY_NOT_PASS'}
$operator=Start-Process -FilePath $node -WorkingDirectory $install -ArgumentList @("`"$install\operator\server.mjs`"") -WindowStyle Hidden -PassThru -RedirectStandardOutput "$state\operator\stdout.log" -RedirectStandardError "$state\operator\stderr.log"
$agent=Start-Process -FilePath $pwsh -WorkingDirectory $install -Credential $credential -LoadUserProfile -ArgumentList @('-NoProfile','-File',"`"$install\scripts\real-lab\Start-PilotRuntime.ps1`"",'-Role','Agent') -WindowStyle Hidden -PassThru -RedirectStandardOutput "$state\agent\stdout.log" -RedirectStandardError "$state\agent\stderr.log"
[pscustomobject]@{OperatorPid=$operator.Id;AgentLauncherPid=$agent.Id;Mode='terminal-only';StartedAt=[DateTime]::UtcNow.ToString('o')} | ConvertTo-Json | Set-Content "$state\operator\processes.json"
$deadline=[DateTime]::UtcNow.AddSeconds(30)
$ready=$false
[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
while([DateTime]::UtcNow -lt $deadline){
  try {
    $response=Invoke-WebRequest 'https://127.0.0.1:4174/api/v1/status' -UseBasicParsing -TimeoutSec 2
    $status=$response.Content|ConvertFrom-Json
    if($status.terminalEnabled -and $status.secureTransport -and $status.phase -eq 'terminal_only'){$ready=$true;break}
  }catch{}
  Start-Sleep -Milliseconds 300
}
if(-not $ready){throw "AGENT_NOT_READY: inspect $state\agent\stderr.log and $state\operator\stderr.log; do not arm trial"}
$runtime=Get-Content "$state\agent\runtime-evidence.json" -Raw|ConvertFrom-Json
$nodeProcess=Get-CimInstance Win32_Process -Filter "ProcessId=$($runtime.pid)"
if($nodeProcess.ExecutablePath -ne $node){throw 'AGENT_EXECUTABLE_IDENTITY_MISMATCH'}
$owner=Invoke-CimMethod -InputObject $nodeProcess -MethodName GetOwner
if($owner.ReturnValue -ne 0 -or $owner.User -ne 'TicketSimAgent'){throw 'AGENT_PROCESS_OWNER_MISMATCH'}
[pscustomobject]@{Pass=$true;AgentPrincipal="$($owner.Domain)\$($owner.User)";AgentNodePid=$runtime.pid;OperatorPrincipal=[Security.Principal.WindowsIdentity]::GetCurrent().Name;OperatorNodePid=$operator.Id;AgentEvidence=$agentEvidence;Runtime=$runtime;TlsVerified=$true;CheckedAt=[DateTime]::UtcNow.ToString('o')}|ConvertTo-Json -Depth 6|Set-Content "$state\operator\m1-evidence.json"
# Open the authenticated bootstrap link locally; never print the one-time secret in a report.
$link=[IO.File]::ReadAllText("$state\agent\pairing-link.txt").Trim()
Start-Process $link
Write-Output 'Opened secure pilot in browser. Run read-only preflight, then enter learner SSH password only in the web form. Fault and reset are disabled.'
