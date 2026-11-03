function Set-PilotCallerModulePath {
  # Modules loaded in this process must match its CLR/PowerShell version.
  $env:PSModulePath="$PSHOME\Modules;$env:WINDIR\System32\WindowsPowerShell\v1.0\Modules;$env:ProgramFiles\WindowsPowerShell\Modules"
}

function Invoke-PilotPowerShell {
  param(
    [Parameter(Mandatory)][string]$Script,
    [string[]]$ScriptArguments=@(),
    [string]$Executable='C:\Program Files\TicketSimPilot\powershell\pwsh.exe',
    [switch]$Interactive
  )
  # Native command lookup failures must terminate even in a caller whose
  # preference is Continue; a stale LASTEXITCODE cannot prove launch success.
  $ErrorActionPreference='Stop'
  $previous=$env:PSModulePath
  $moduleRoot=Join-Path (Split-Path $Executable) 'Modules'
  try{
    $env:PSModulePath="$moduleRoot;$env:WINDIR\System32\WindowsPowerShell\v1.0\Modules;$env:ProgramFiles\WindowsPowerShell\Modules"
    $hostArguments=@('-NoProfile')
    if(-not $Interactive){$hostArguments+='-NonInteractive'}
    $hostArguments+=@('-File',$Script)
    $hostArguments+=$ScriptArguments
    # Foreground console is intentional only for the local credential prompt.
    # Child environment changes never contaminate the Windows PS 5.1 caller.
    & $Executable @hostArguments
    if($LASTEXITCODE -ne 0){throw "PILOT_CHILD_HOST_FAILED_EXIT_$LASTEXITCODE"}
  }finally{$env:PSModulePath=$previous}
}
Export-ModuleMember -Function Set-PilotCallerModulePath,Invoke-PilotPowerShell
