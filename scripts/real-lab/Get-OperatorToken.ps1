# Read-only token/Hyper-V probe; no credential prompt or evidence overwrite.
$ErrorActionPreference='Stop'
$identity=[Security.Principal.WindowsIdentity]::GetCurrent()
$principal=[Security.Principal.WindowsPrincipal]$identity
$groups=@($identity.Groups | ForEach-Object Value)
$readable=$false
try { $vm=Get-VM -Id '2b9c2170-9a23-4d08-b82e-29929afa4c10' -ErrorAction Stop; $readable=($vm.Id.ToString() -eq '2b9c2170-9a23-4d08-b82e-29929afa4c10') } catch { }
[pscustomobject]@{Principal=$identity.Name;Sid=$identity.User.Value;Elevated=$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator);AdministratorMember=($groups -contains 'S-1-5-32-544');HyperVReadable=$readable}|ConvertTo-Json -Compress
