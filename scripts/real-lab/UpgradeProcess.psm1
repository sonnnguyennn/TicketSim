function ConvertFrom-WindowsCommandLine {
  param([Parameter(Mandatory)][string]$CommandLine)
  if(-not ('TicketSim.NativeArgs' -as [type])){
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
namespace TicketSim {
 public static class NativeArgs {
  [DllImport("shell32.dll", SetLastError=true)] public static extern IntPtr CommandLineToArgvW([MarshalAs(UnmanagedType.LPWStr)] string command, out int count);
  [DllImport("kernel32.dll")] public static extern IntPtr LocalFree(IntPtr memory);
 }
}
'@
  }
  $count=0;$pointer=[TicketSim.NativeArgs]::CommandLineToArgvW($CommandLine,[ref]$count)
  if($pointer -eq [IntPtr]::Zero){throw 'PROCESS_ARGUMENT_PARSE_FAILED'}
  try{for($i=0;$i -lt $count;$i++){[Runtime.InteropServices.Marshal]::PtrToStringUni([Runtime.InteropServices.Marshal]::ReadIntPtr($pointer,$i*[IntPtr]::Size))}}
  finally{$null=[TicketSim.NativeArgs]::LocalFree($pointer)}
}

function Assert-UpgradeProcessIdentity {
  param([Parameter(Mandatory)]$Process,[Parameter(Mandatory)][string[]]$Arguments,[Parameter(Mandatory)][string]$Role,[Parameter(Mandatory)]$Record,[Parameter(Mandatory)]$M1,[Parameter(Mandatory)][string]$AgentSid,[Parameter(Mandatory)][string]$OperatorSid,[Parameter(Mandatory)][string]$OwnerSid)
  $install='C:\Program Files\TicketSimPilot'
  switch($Role){
    'Agent' {$expected=@("$install\node.exe","$install\agent\pilot.mjs");$expectedPid=$M1.AgentNodePid;$expectedTime=[datetime]$M1.Runtime.startedAt;$sid=$AgentSid}
    'Operator' {$expected=@("$install\node.exe","$install\operator\server.mjs");$expectedPid=$Record.OperatorPid;$expectedTime=[datetime]$Record.StartedAt;$sid=$OperatorSid}
    'Launcher' {$mode=if($Record.Mode -eq 'approved-trial'){'Trial'}else{'TerminalOnly'};$expected=@("$install\powershell\pwsh.exe",'-NoProfile','-File',"$install\scripts\real-lab\Start-PilotRuntime.ps1",'-Role','Agent','-Mode',$mode);$expectedPid=$Record.AgentLauncherPid;$expectedTime=[datetime]$Record.StartedAt;$sid=$AgentSid}
    default {throw 'UNKNOWN_UPGRADE_PROCESS_ROLE'}
  }
  if($Process.ProcessId -ne $expectedPid -or $OwnerSid -ne $sid -or $Process.ExecutablePath -ine $expected[0] -or $Arguments.Count -ne $expected.Count){throw 'UPGRADE_PROCESS_IDENTITY_MISMATCH'}
  for($i=0;$i -lt $expected.Count;$i++){if($Arguments[$i] -ine $expected[$i]){throw 'UPGRADE_PROCESS_ARGUMENT_MISMATCH'}}
  if([math]::Abs((([datetime]$Process.CreationDate).ToUniversalTime()-$expectedTime.ToUniversalTime()).TotalSeconds) -gt 10){throw 'UPGRADE_PROCESS_CREATION_MISMATCH'}
}
Export-ModuleMember -Function ConvertFrom-WindowsCommandLine,Assert-UpgradeProcessIdentity
