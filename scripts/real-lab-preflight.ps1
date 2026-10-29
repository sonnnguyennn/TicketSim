param(
  [string]$VmName = 'lab1',
  [string]$ManagementIp
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Observation($Status, $Value, $Detail = '') {
  return [ordered]@{ status = $Status; value = $Value; detail = $Detail }
}

$result = [ordered]@{
  schemaVersion = 1
  checkedAt = (Get-Date).ToUniversalTime().ToString('o')
  targetVmName = $VmName
  windows = Observation 'unknown' $null
  powershell = Observation 'pass' $PSVersionTable.PSVersion.ToString()
  hostResources = [ordered]@{ memory = Observation 'unknown' $null; drives = Observation 'unknown' $null; switches = Observation 'unknown' $null }
  hostNetwork = [ordered]@{ addresses = Observation 'unknown' $null; routes = Observation 'unknown' $null; adapters = Observation 'unknown' $null; managementTcp22 = Observation 'unknown' $null 'No endpoint supplied; TCP reachability alone does not prove SSH identity or authentication.' }
  hyperv = [ordered]@{ module = Observation 'unknown' $null; vm = Observation 'unknown' $null; switch = Observation 'unknown' $null; adapter = Observation 'unknown' $null; disks = Observation 'unknown' $null; checkpoints = Observation 'unknown' $null }
  multipass = [ordered]@{ executable = Observation 'unknown' $null; version = Observation 'unknown' $null; driver = Observation 'unknown' $null; list = Observation 'unknown' $null; instance = Observation 'unknown' $null }
  ownership = Observation 'unknown' 'undetermined'
  storage = Observation 'unknown' $null 'Backup/disposable capacity is not confirmed.'
  ready = $false
}

try {
  $os = Get-CimInstance -ClassName Win32_OperatingSystem
  $result.windows = Observation 'pass' ([ordered]@{ caption = $os.Caption; version = $os.Version; build = $os.BuildNumber })
  $result.hostResources.memory = Observation 'pass' ([ordered]@{ totalVisibleKb = $os.TotalVisibleMemorySize; freePhysicalKb = $os.FreePhysicalMemory })
} catch { $result.windows = Observation 'unknown' $null $_.Exception.Message }
try { $result.hostResources.drives = Observation 'pass' @(Get-PSDrive -PSProvider FileSystem | Select-Object Name, Root, Free, Used) } catch { $result.hostResources.drives = Observation 'unknown' $null $_.Exception.Message }
try { $result.hostNetwork.addresses = Observation 'pass' @(Get-NetIPAddress -AddressFamily IPv4 | Select-Object InterfaceAlias, IPAddress, PrefixLength) } catch { $result.hostNetwork.addresses = Observation 'unknown' $null $_.Exception.Message }
try { $result.hostNetwork.routes = Observation 'pass' @(Get-NetRoute -AddressFamily IPv4 | Select-Object DestinationPrefix, NextHop, InterfaceAlias) } catch { $result.hostNetwork.routes = Observation 'unknown' $null $_.Exception.Message }
try { $result.hostNetwork.adapters = Observation 'pass' @(Get-NetAdapter | Where-Object { $_.Name -like 'vEthernet*' } | Select-Object Name, Status, MacAddress, InterfaceDescription) } catch { $result.hostNetwork.adapters = Observation 'unknown' $null $_.Exception.Message }
if ($ManagementIp) {
  $parsedIp = $null
  if (-not [System.Net.IPAddress]::TryParse($ManagementIp, [ref]$parsedIp) -or $parsedIp.AddressFamily -ne [System.Net.Sockets.AddressFamily]::InterNetwork) { throw 'ManagementIp must be an IPv4 address.' }
  try {
    $tcpOpen = Test-NetConnection -ComputerName $ManagementIp -Port 22 -InformationLevel Quiet -WarningAction SilentlyContinue
    $result.hostNetwork.managementTcp22 = Observation $(if ($tcpOpen) { 'pass' } else { 'fail' }) ([ordered]@{ address = $ManagementIp; port = 22; reachable = [bool]$tcpOpen }) 'TCP only; SSH host key, authentication, and recovery remain separate.'
  } catch { $result.hostNetwork.managementTcp22 = Observation 'unknown' $null $_.Exception.Message }
}

$module = Get-Module -ListAvailable -Name Hyper-V | Select-Object -First 1
if ($null -eq $module) {
  $result.hyperv.module = Observation 'fail' $null 'Hyper-V PowerShell module unavailable.'
} else {
  $result.hyperv.module = Observation 'pass' $module.Version.ToString()
  try { $result.hostResources.switches = Observation 'pass' @(Get-VMSwitch | Select-Object Name, SwitchType, Id) } catch { $result.hostResources.switches = Observation 'unknown' $null $_.Exception.Message }
  try {
    $vm = Get-VM -Name $VmName
    $result.hyperv.vm = Observation 'pass' ([ordered]@{ name = $vm.Name; id = $vm.Id.ToString(); state = $vm.State.ToString(); generation = $vm.Generation; processorCount = $vm.ProcessorCount; memoryStartupBytes = $vm.MemoryStartup })
    try { $result.hyperv.adapter = Observation 'pass' @(Get-VMNetworkAdapter -VMName $VmName | Select-Object Name, SwitchName, MacAddress, IPAddresses) } catch { $result.hyperv.adapter = Observation 'unknown' $null $_.Exception.Message }
    try { $result.hyperv.disks = Observation 'pass' @(Get-VMHardDiskDrive -VMName $VmName | Select-Object ControllerType, ControllerNumber, ControllerLocation, Path) } catch { $result.hyperv.disks = Observation 'unknown' $null $_.Exception.Message }
    try { $result.hyperv.checkpoints = Observation 'pass' @(Get-VMSnapshot -VMName $VmName | Select-Object Name, Id, CreationTime, SnapshotType) } catch { $result.hyperv.checkpoints = Observation 'unknown' $null $_.Exception.Message }
    if ($result.hyperv.adapter.status -eq 'pass') {
      try {
        $switchNames = @($result.hyperv.adapter.value | ForEach-Object { $_.SwitchName } | Where-Object { $_ } | Select-Object -Unique)
        $result.hyperv.switch = Observation 'pass' @(Get-VMSwitch | Where-Object { $switchNames -contains $_.Name } | Select-Object Name, SwitchType, Id)
      } catch { $result.hyperv.switch = Observation 'unknown' $null $_.Exception.Message }
    }
    $diskPaths = @($result.hyperv.disks.value | Where-Object { $null -ne $_ -and $_.PSObject.Properties['Path'] } | ForEach-Object { $_.Path } | Where-Object { $_ })
    if ($diskPaths.Count -gt 0) {
      $diskRoot = [System.IO.Path]::GetPathRoot($diskPaths[0])
      if ($diskRoot) {
        $drive = Get-PSDrive -Name $diskRoot.Substring(0, 1)
        $result.storage = Observation 'unknown' ([ordered]@{ diskRoot = $diskRoot; freeBytes = $drive.Free }) 'Free bytes observed; required backup and disposable VM size is not known.'
      }
    }
  } catch { $result.hyperv.vm = Observation 'unknown' $null $_.Exception.Message }
}

$multipassCommand = Get-Command -Name multipass -ErrorAction SilentlyContinue
if ($null -eq $multipassCommand) {
  $result.multipass.executable = Observation 'fail' $null 'Multipass executable unavailable.'
} else {
  $result.multipass.executable = Observation 'pass' $multipassCommand.Source
  try {
    $versionText = (& $multipassCommand.Source version 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -eq 0) { $result.multipass.version = Observation 'pass' $versionText }
    else { $result.multipass.version = Observation 'unknown' $null $versionText }
  } catch { $result.multipass.version = Observation 'unknown' $null $_.Exception.Message }
  try {
    $driverText = (& $multipassCommand.Source get local.driver 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -eq 0) { $result.multipass.driver = Observation 'pass' $driverText }
    else { $result.multipass.driver = Observation 'unknown' $null $driverText }
  } catch { $result.multipass.driver = Observation 'unknown' $null $_.Exception.Message }
  try {
    $listJson = & $multipassCommand.Source list --format json 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) { $result.multipass.list = Observation 'pass' ($listJson | ConvertFrom-Json) }
    else { $result.multipass.list = Observation 'unknown' $null $listJson.Trim() }
  } catch { $result.multipass.list = Observation 'unknown' $null $_.Exception.Message }
  try {
    $instanceJson = & $multipassCommand.Source info $VmName --format json 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) { $result.multipass.instance = Observation 'pass' ($instanceJson | ConvertFrom-Json) }
    else { $result.multipass.instance = Observation 'unknown' $null $instanceJson.Trim() }
  } catch { $result.multipass.instance = Observation 'unknown' $null $_.Exception.Message }
}

$multipassPath = @($result.hyperv.disks.value | Where-Object { $null -ne $_ -and $_.PSObject.Properties['Path'] } | ForEach-Object { $_.Path } | Where-Object { $_ -match '(?i)[\\/]Multipass[\\/]' }).Count -gt 0
$multipassListed = $result.multipass.list.status -eq 'pass' -and @($result.multipass.list.value.list | Where-Object { $_.name -eq $VmName }).Count -gt 0
if ($multipassPath -and $result.multipass.instance.status -eq 'pass') {
  $result.ownership = Observation 'unknown' 'likely-multipass-managed' 'VHD path and Multipass instance agree; operator must confirm ownership before lifecycle actions.'
} elseif ($multipassListed) {
  $result.ownership = Observation 'unknown' 'possibly-multipass-managed' 'Multipass lists this instance; Hyper-V lifecycle ownership is not confirmed.'
} elseif ($multipassPath) {
  $result.ownership = Observation 'unknown' 'possibly-multipass-managed' 'VHD path alone is not proof of ownership.'
}

$result | ConvertTo-Json -Depth 12
