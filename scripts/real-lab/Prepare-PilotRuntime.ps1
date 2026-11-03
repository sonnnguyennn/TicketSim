param([switch]$Apply, [switch]$Refresh)
$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$install = 'C:\Program Files\TicketSimPilot'
$state = 'C:\ProgramData\TicketSimPilot'
$account = 'TicketSimAgent'
$operatorName = [Security.Principal.WindowsIdentity]::GetCurrent().Name
if (-not $Apply) {
  [pscustomobject]@{Apply=$false;Install=$install;State=$state;Agent=$account;Operator=$operatorName;Changes='Create standard account; protect pilot files; deny this Agent SID writes to original VM and backup paths (ACL only, no content change); copy runtime; create loopback TLS certificate. No VM lifecycle or guest commands.'} | ConvertTo-Json
  return
}
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'RUN_IN_ELEVATED_OPERATOR_POWERSHELL' }
if (Test-Path 'E:\TicketSimOperatorState\b5\exclusive-lease') { throw 'B5_LEASE_HELD' }
if (Test-Path "$state\operator\first-web-trial-admission.json") { throw 'TRIAL_ADMISSION_EXISTS_DO_NOT_REFRESH' }
$user = Get-LocalUser -Name $account -ErrorAction SilentlyContinue
if (-not $user) {
  $password = Read-Host 'Set a Windows password for TicketSimAgent (not the learner SSH password)' -AsSecureString
  $user = New-LocalUser -Name $account -Password $password -Description 'Unprivileged TicketSim pilot Agent'
  Add-LocalGroupMember -Group (Get-LocalGroup -SID 'S-1-5-32-545') -Member $account
}
$agentSid = $user.SID.Value
foreach ($groupSid in @('S-1-5-32-544','S-1-5-32-578')) {
  if (@(Get-LocalGroupMember -SID $groupSid | Where-Object { $_.SID.Value -eq $agentSid }).Count) { throw 'AGENT_HAS_PRIVILEGED_MEMBERSHIP' }
}
function Set-ProtectedDirectory([string]$Path,[bool]$AgentWrite=$false,[bool]$AgentRead=$false) {
  $null = New-Item -ItemType Directory -Path $Path -Force
  $acl = New-Object Security.AccessControl.DirectorySecurity
  $acl.SetAccessRuleProtection($true,$false)
  foreach ($sid in @('S-1-5-18','S-1-5-32-544')) {
    $rule = New-Object Security.AccessControl.FileSystemAccessRule([Security.Principal.SecurityIdentifier]$sid,'FullControl','ContainerInherit,ObjectInherit','None','Allow')
    $acl.AddAccessRule($rule)
  }
  if ($AgentWrite -or $AgentRead) {
    $rights = if ($AgentWrite) { 'Modify' } else { 'ReadAndExecute' }
    $rule = New-Object Security.AccessControl.FileSystemAccessRule($user.SID,$rights,'ContainerInherit,ObjectInherit','None','Allow')
    $acl.AddAccessRule($rule)
  }
  Set-Acl -LiteralPath $Path -AclObject $acl
}
Set-ProtectedDirectory $install $false $true
Set-ProtectedDirectory $state $false $true
Set-ProtectedDirectory "$state\agent" $true $true
Set-ProtectedDirectory "$state\shared" $false $true
Set-ProtectedDirectory "$state\operator"
if (Test-Path "$state\agent\runs.sqlite") {
  $leaseOutput = & 'C:\Program Files\nodejs\node.exe' (Join-Path $repo 'scripts/real-lab/inspect-leases.mjs') "$state\agent\runs.sqlite"
  if ($LASTEXITCODE -ne 0) { throw 'LEASE_INSPECTION_FAILED' }
  if (-not ($leaseOutput | ConvertFrom-Json).clear) { throw 'AGENT_LEASE_HELD' }
  if (-not $Refresh) { throw 'EXISTING_DATABASE_REQUIRES_EXPLICIT_REFRESH' }
}
if (@(Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -eq "$install\node.exe" }).Count) { throw 'STOP_PILOT_PROCESSES_BEFORE_REFRESH' }
# Agent-specific deny preserves all other principals and backup bytes/hashes.
# Apply an explicit deny to every object: inherited deny alone can lose to explicit allow.
$protectedRoots = @('E:\TicketSimVMs\ticketsim-lab','C:\TicketSimBackups\baseline-2b9c2170-20261029')
foreach ($path in $protectedRoots) {
  if (-not (Test-Path -LiteralPath $path -PathType Container)) { throw 'PROTECTED_PATH_MISSING' }
  & icacls.exe $path /deny "*$($agentSid):(OI)(CI)(W,D,DC,WDAC,WO)" /T /Q | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'AGENT_WRITE_DENY_FAILED' }
}
if (-not (Test-Path (Join-Path $repo 'dist/index.html'))) { throw 'RUN_NPM_BUILD_FIRST' }
foreach ($name in @('agent','operator','scripts','src','dist','node_modules')) {
  $source = Join-Path $repo $name
  $dest = Join-Path $install $name
  & robocopy.exe $source $dest /E /COPY:DAT /DCOPY:DAT /NFL /NDL /NJH /NJS /NP | Out-Null
  if ($LASTEXITCODE -ge 8) { throw 'RUNTIME_COPY_FAILED' }
}
Copy-Item (Join-Path $repo 'package.json') $install -Force
Copy-Item (Join-Path $repo 'package-lock.json') $install -Force
Copy-Item 'C:\Program Files\nodejs\node.exe' "$install\node.exe" -Force
# Copy the PowerShell distribution, rather than trusting a writable per-user executable.
$pwshCommand = Get-Command pwsh.exe -ErrorAction SilentlyContinue
$pwshExecutable = if ($pwshCommand) { $pwshCommand.Source } else { $null }
if (-not $pwshExecutable) {
  foreach ($candidate in @('C:\Program Files\PowerShell\7\pwsh.exe',(Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe'))) {
    if (Test-Path -LiteralPath $candidate -PathType Leaf) { $pwshExecutable=$candidate; break }
  }
}
if (-not $pwshExecutable) { throw 'POWERSHELL_7_NOT_FOUND: supply an installed PowerShell 7 before continuing' }
$pwshDir = Split-Path $pwshExecutable
& robocopy.exe $pwshDir "$install\powershell" /E /COPY:DAT /DCOPY:DAT /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw 'POWERSHELL_COPY_FAILED' }
# Reset inherited ACLs on copied files; never import source security descriptors.
& icacls.exe "$install\*" /reset /T /Q | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'RUNTIME_ACL_RESET_FAILED' }
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
function New-Secret { $bytes=New-Object byte[] 40; $rng.GetBytes($bytes); [Convert]::ToBase64String($bytes) }
if (-not (Test-Path "$state\shared\bridge-token")) { [IO.File]::WriteAllText("$state\shared\bridge-token",(New-Secret)) }
if (-not (Test-Path "$state\shared\tls.pfx")) {
  $pass = New-Secret
  $cert = New-SelfSignedCertificate -Subject 'CN=TicketSim local pilot' -CertStoreLocation Cert:\LocalMachine\My -KeyAlgorithm RSA -KeyLength 2048 -NotAfter (Get-Date).AddDays(90) -TextExtension @('2.5.29.17={text}IPAddress=127.0.0.1&DNS=localhost')
  Export-PfxCertificate -Cert $cert -FilePath "$state\shared\tls.pfx" -Password (ConvertTo-SecureString $pass -AsPlainText -Force) | Out-Null
  [IO.File]::WriteAllText("$state\shared\tls-passphrase",$pass)
  Export-Certificate -Cert $cert -FilePath "$state\shared\tls.cer" | Out-Null
  Import-Certificate -FilePath "$state\shared\tls.cer" -CertStoreLocation Cert:\LocalMachine\Root | Out-Null
  [IO.File]::WriteAllText("$state\operator\tls-thumbprint",$cert.Thumbprint)
}
Copy-Item 'E:\TicketSimOperatorState\b5\agent-key' "$state\shared\agent-key" -Force
$keyAcl=New-Object Security.AccessControl.FileSecurity
$keyAcl.SetAccessRuleProtection($true,$false)
foreach($sid in @('S-1-5-18','S-1-5-32-544')){$keyAcl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule([Security.Principal.SecurityIdentifier]$sid,'FullControl','Allow')))}
$keyAcl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($user.SID,'Read','Allow')))
Set-Acl -LiteralPath "$state\shared\agent-key" -AclObject $keyAcl
& icacls.exe "$state\shared\agent-key" /setowner "*$agentSid" /Q | Out-Null
if($LASTEXITCODE -ne 0){throw 'SSH_KEY_OWNER_FAILED'}
Copy-Item 'E:\TicketSimOperatorState\b1-20261029\ticketsim-lab-known-hosts' "$state\shared\known-hosts" -Force
Copy-Item 'E:\TicketSimOperatorState\b5\first-trial-approval.DRAFT.json' "$state\operator\approval.DRAFT.json" -Force
Copy-Item 'E:\TicketSimOperatorState\b5\first-trial-approval.DRAFT.json' "$state\shared\baseline.json" -Force
$draft = Get-Content "$state\operator\approval.DRAFT.json" -Raw | ConvertFrom-Json
if ($draft.firstTrialApproved -or $draft.resetApproved) { throw 'M1_M2_MUST_NOT_ARM_TRIAL' }
$hashes=@{}
foreach($relative in @('node.exe','powershell\pwsh.exe','agent\pilot.mjs','agent\server.mjs','agent\terminalService.mjs','agent\trialPermit.mjs','operator\server.mjs','scripts\real-lab\Invoke-LabHost.ps1','scripts\real-lab\Start-PilotRuntime.ps1','scripts\real-lab\Verify-PilotIdentity.ps1','package-lock.json')){$hashes[$relative]=(Get-FileHash -LiteralPath (Join-Path $install $relative) -Algorithm SHA256).Hash}
[pscustomobject]@{AgentName="$env:COMPUTERNAME\$account";AgentSid=$agentSid;Operator=$operatorName;Install=$install;State=$state;PreparedAt=[DateTime]::UtcNow.ToString('o');TrialArmed=$false;CodeHashes=$hashes} | ConvertTo-Json -Depth 4 | Set-Content "$state\operator\preparation.json"
Write-Output 'Prepared only. No live services, guest commands, fault, reset or checkpoint operations were performed.'
Write-Output "Next: run Verify-PilotIdentity.ps1 under TicketSimAgent and the Operator. M1 remains NOT PASS until actual evidence is checked."
