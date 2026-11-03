param([ValidateSet('Agent','Operator')][string]$Role='Agent')
$ErrorActionPreference='Stop'
$identity=[Security.Principal.WindowsIdentity]::GetCurrent()
$principal=[Security.Principal.WindowsPrincipal]$identity
$groups=@($identity.Groups | ForEach-Object Value)
$adminMember=($groups -contains 'S-1-5-32-544')
$hypervMember=($groups -contains 'S-1-5-32-578')
$hypervReadable='unknown'
try {
  $null=Get-Command Get-VM -ErrorAction Stop
  try { $vm=Get-VM -Id '2b9c2170-9a23-4d08-b82e-29929afa4c10' -ErrorAction Stop; $hypervReadable=($vm.Id.ToString() -eq '2b9c2170-9a23-4d08-b82e-29929afa4c10') }
  catch { if($_.CategoryInfo.Category -eq 'PermissionDenied' -or $_.Exception.Message -match 'required permission|Access is denied|Access denied|not authorized'){$hypervReadable=$false} }
} catch { }
$writable=@{}
foreach($path in @('C:\Program Files\TicketSimPilot','C:\ProgramData\TicketSimPilot\operator','C:\ProgramData\TicketSimPilot\agent')) {
  $probe=Join-Path $path ('identity-probe-'+[guid]::NewGuid().ToString('N'))
  try { [IO.File]::WriteAllText($probe,'access probe'); Remove-Item -LiteralPath $probe; $writable[$path]=$true } catch { $writable[$path]=$false }
}
# Open existing files for write-access validation WITHOUT writing or truncating any bytes.
# FileShare.ReadWrite avoids exclusive locks; an unexpected granted handle is closed immediately.
$sensitive=@('C:\TicketSimBackups\baseline-2b9c2170-20261029\ticketsim-lab\Virtual Hard Disks\ubuntu.vhdx','E:\TicketSimVMs\ticketsim-lab\ubuntu.vhdx')
foreach($path in $sensitive) {
  try { $stream=[IO.File]::Open($path,[IO.FileMode]::Open,[IO.FileAccess]::Write,[IO.FileShare]::ReadWrite); $stream.Dispose(); $writable[$path]=$true } catch [UnauthorizedAccessException] { $writable[$path]=$false } catch { $writable[$path]='unknown' }
}
$pass=if($Role -eq 'Agent') { -not $adminMember -and -not $hypervMember -and $hypervReadable -eq $false -and $writable['C:\ProgramData\TicketSimPilot\agent'] -eq $true -and @($writable.GetEnumerator() | Where-Object {$_.Key -ne 'C:\ProgramData\TicketSimPilot\agent' -and $_.Value -ne $false}).Count -eq 0 } else { $hypervReadable -eq $true }
$result=[pscustomobject]@{Role=$Role;Principal=$identity.Name;Sid=$identity.User.Value;AdministratorMember=$adminMember;Elevated=$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator);HyperVMember=$hypervMember;HyperVReadable=$hypervReadable;WriteAccess=$writable;Pass=$pass;CheckedAt=[DateTime]::UtcNow.ToString('o')}
$dest=if($Role -eq 'Agent'){'C:\ProgramData\TicketSimPilot\agent\identity-evidence.json'}else{'C:\ProgramData\TicketSimPilot\operator\identity-evidence.json'}
$result | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $dest
$result | ConvertTo-Json -Depth 5
if(-not $pass){throw 'IDENTITY_ISOLATION_NOT_VERIFIED'}
