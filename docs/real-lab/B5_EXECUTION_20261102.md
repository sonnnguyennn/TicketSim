# B5 execution handoff — 2026-11-02

PM supplied a successful elevated read-only preflight: original and recovery Off, exact three VM identities, no original checkpoint/parent, backup hash matched. Codex repeated Get-VM read-only and was denied Hyper-V permission. No elevation, start, guest installation, checkpoint, reset or fault was attempted.

Fresh non-elevated observations: free RAM 3,592,072 KiB (~3.43 GiB), C free 16,898,953,216 bytes (~15.74 GiB), E free 37,981,470,720 bytes (~35.37 GiB). The B5 exclusive-lease path is absent. The current user's default agent runs.sqlite is absent; this does not clear databases under other configured paths/accounts. Dedicated guest account/key/sudoers remain UNKNOWN while the original is Off. Original directory inventory contains four files totaling 7,088,501,248 bytes; it is not a current hash verification. Backup was not rehashed by this turn.

E storage growth remains unattributed: current original directory size does not explain the roughly 19.6 GiB drop from the older E free-space observation. Root inventory includes an 8,388,608,000-byte pagefile, but no historical size comparison proves it caused the drop. No unrelated files were changed or removed. Operator should review recent storage growth before checkpoint creation.

## Exact next action: approved original boot for guest-agent preparation

Target: ticketsim-lab, 2b9c2170-9a23-4d08-b82e-29929afa4c10. Effect: boot only this existing disposable VM to inspect/install the reviewed guest agent. Expected result: original Running, recovery remains Off; lab1 unchanged. Failure: stop and preserve evidence; do not retry, force stop or roll back automatically. This is not checkpoint/reset/fault approval.

After confirming all actual agent database locations have no unresolved target lease, an elevated operator can run this one guarded command and explicitly approve at its prompt:

```powershell
& {
  $target = Get-VM -Id '2b9c2170-9a23-4d08-b82e-29929afa4c10' -ErrorAction Stop
  $recovery = Get-VM -Id '463dddf4-6e47-47b7-a39f-5b5d7ef84df0' -ErrorAction Stop
  $protected = Get-VM -Id '546953dc-48e4-4080-839d-27ad5552ac7d' -ErrorAction Stop
  if ($target.Name -ne 'ticketsim-lab' -or $target.State -ne 'Off' -or $recovery.Name -ne 'ticketsim-lab-recovery' -or $recovery.State -ne 'Off' -or $protected.Name -ne 'lab1') { throw 'VM_IDENTITY_OR_STATE_MISMATCH' }
  if (Test-Path -LiteralPath 'E:\TicketSimOperatorState\b5\exclusive-lease') { throw 'B5_LEASE_HELD' }
  if ((Get-CimInstance Win32_OperatingSystem -ErrorAction Stop).FreePhysicalMemory * 1KB -lt 3GB -or (Get-PSDrive C -ErrorAction Stop).Free -lt 12GB -or (Get-PSDrive E -ErrorAction Stop).Free -lt 15GB) { throw 'RESOURCE_MINIMUM_FAILED' }
  if ((Read-Host 'Type APPROVE B5 prepare-start 2b9c2170') -cne 'APPROVE B5 prepare-start 2b9c2170') { throw 'NOT_APPROVED' }
  Start-VM -VM $target -ErrorAction Stop
  Get-VM -Id $target.Id,$recovery.Id,$protected.Id | Select-Object Name,Id,State
}
```

Return the actual output before guest changes. Subsequent guest installation, clean shutdown, checkpoint and marker/reset qualification retain their separate approval boundaries. Cold restoration requires reinstalling the guest agent because the retained cold backup predates that setup. B5 PASS and first-trial readiness remain UNKNOWN; the first Nginx fault still requires fresh approval after actual B5 PASS.
