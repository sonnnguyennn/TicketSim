$ErrorActionPreference='Stop'
# Operator reads an existing protected one-time link; no service restart or run mutation.
$link=[IO.File]::ReadAllText('C:\ProgramData\TicketSimPilot\agent\pairing-link.txt').Trim()
if($link -notmatch '^https://127\.0\.0\.1:4174/#pair=[A-Za-z0-9_-]+$'){throw 'INVALID_PAIRING_LINK'}
Start-Process $link
Write-Output 'Opened the local HTTPS pairing link. No secret was printed.'
