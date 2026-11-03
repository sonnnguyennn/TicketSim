# Web-first MVP — accelerated implementation, 2026-11-03

PM accepted the long-term web-product architecture but superseded sequential W0–W7 delivery: **M1 secure minimal runtime → M2 usable browser lab → M3 one actual trial → M4 packaging later**. No installer, service framework, updater, SSE, new VM/checkpoint or live-scenario expansion is required for M2.

## Current status and boundaries

**Actual pickup update:** operator/user completed the actual browser checks and supplied screenshots plus `sudo -l` authorization. See [M2 actual evidence](M2_ACTUAL_BROWSER_20261103.md). M1 is linked to the successful protected launcher; the M3 launcher validates its detailed protected evidence again. M3 code now includes explicit consent, unused-state checks, a one-hour start window and a read-only final report. It has not armed or run a trial in this update. The preparation-only statements below describe the preceding implementation checkpoint.

- User ran `Prepare-PilotRuntime.ps1 -Apply` successfully after the PowerShell discovery fix. `TicketSimAgent` exists, SID ending `1006`. That is preparation evidence, **not M1 PASS**.
- Source implementation for M1/M2 exists; final deployed-copy identity/access probes and actual browser PTY on original are required before claiming M1/M2 PASS.
- M3 is NOT RUN. Both flags in the existing first-trial draft remain false; no fault, reset, run claim or checkpoint mutation has been performed by this implementation.
- Default launcher is **terminal-only**. The Operator in this mode refuses claim, reset and finalization, even with a valid machine token. Read-only baseline verification uses the actual B5 proof with false trial flags.
- Terminal-only describes the orchestration permit, not a Linux command sandbox: an interactive `lab` PTY can run commands allowed by the guest account. During M2 qualification the operator/learner must use read-only commands only. There is no command denylist pretending to sandbox shell input.
- Existing 112 tickets, Guided fixtures, command cards, old-origin progress and hidden-mode engines remain intact. The new HTTPS pilot has a separate browser origin. Automated origin migration is explicitly M4; existing export/import remains available.

## Implemented files and features

| Area | Files | Behavior |
|---|---|---|
| Protected runtime setup | `scripts/real-lab/Prepare-PilotRuntime.ps1` | Dry-run default; explicit Apply creates standard Agent account, protected runtime/state, targeted Agent SID write-denies on original/backup paths (ACL only), copies runtime and dedicated key, creates loopback TLS cert. No VM lifecycle, guest setup or approval arming. |
| Actual isolation probes | `Verify-PilotIdentity.ps1`, `agent/privilege.mjs` | Group/token checks, real Get-VM access/denial, actual filesystem write-access probes without changing disk/backup bytes. Missing/ambiguous Hyper-V access result is not PASS. |
| Minimal operator launch | `Start-PilotRuntime.ps1`, `Stop-PilotRuntime.ps1`, `Open-Pilot.ps1`, `agent/pilot.mjs` | Separate credential/principal, protected executable paths and PowerShell module path, code hash checks, HTTPS readiness verification, actual Node PID owner evidence. No background service installer. Stop helper refuses active/quarantined runs and only stops recorded terminal-only app processes. |
| Web session | `agent/auth.mjs`, `server.mjs`, `src/real-lab/client.ts` | HTTPS HttpOnly/Secure/SameSite cookie, CSRF + exact Origin/Host checks, renewal with stable owner and two-hour absolute cap; expired session can receive a new operator-mediated one-time pairing link without restarting services. No password/token in browser storage. |
| Guest terminal | `agent/terminalService.mjs`, `LabTerminal.tsx` | xterm, genuine SSH PTY fixed to `lab@10.77.77.3`, explicit host-key verifier, WSS, UTF-8, Ctrl+C, resize, pager/editor transport, one writer, bounded queues, 60-second reconnect grace. No host shell, arbitrary target, forwarding or SFTP interface. No terminal transcript/keystroke logging. |
| Web workflow | `agent/webPilot.mjs`, `RealLabPage.tsx` | Actual read-only preflight, baseline terminal authentication, website verification, server deadline, note autosave and refresh/resume, bounded polling, neutral ticket, result and recovery status. Internal setup action ID is omitted from learner events/catalog title. |
| Durable operations | `agent/store.mjs` | Additive SQLite v4 `web_operations`; stable logical idempotency keys, accepted Start/Submit return 202; pending work becomes unknown on restart and is not replayed. No second real trial may be started through the pilot once a real run is recorded. |
| Recovery boundary | `liveService.mjs`, `liveOperations.mjs`, `operatorBridge.mjs`, `operator/server.mjs`, `Invoke-LabHost.ps1` | Revoke/freeze/close terminal before grade/reset. Uncertain closure remains blocked. Grade recorded before recovery. Operator finalization requires a recorded successful reset and happens after independent baseline checks. Standard checkpoint check and protected VM before/after state comparison. Existing no-reset-retry rule retained. |

The learner's SSH password is entered only into the local HTTPS form, used transiently for SSH authentication, then removed from React state/request objects. It is not persisted in SQLite, application logs or web storage. JavaScript memory cannot offer guaranteed immediate zeroization. Production TLS material and machine/service keys stay outside Git; the committed certificate/key under `tests/fixtures` are explicitly public test-only fixtures and are never used by the actual runtime.

## Operator: deploy the current build and verify M1

These are operator setup commands, not learner instructions. Use **PowerShell Run as administrator**. Account passwords are entered directly on the machine, never in chat.

From source after tests/build:

```powershell
& 'E:\Document\TicketSim\scripts\real-lab\Prepare-PilotRuntime.ps1' -Apply
& 'C:\Program Files\TicketSimPilot\scripts\real-lab\Start-PilotRuntime.ps1'
```

Start prompts for the Windows password of `TicketSimAgent`, first runs the Agent probe under that actual principal and the Operator probe under the elevated operator, then launches only the inspect-only broker and HTTPS terminal-only Agent. It verifies TLS, executable path and actual Agent Node process owner before opening the one-time pairing link. A successful copy alone is not readiness.

The source preparation script can find PowerShell 7 in the official installed location or this host's existing Codex runtime cache when elevated Windows PowerShell lacks `pwsh.exe` in PATH. It copies the distribution to the protected runtime; privileged execution never depends on the writable source/cache afterward.

If an older pilot was already launched, **do not copy code over running processes**. For terminal-only development refresh, after confirming no active/ambiguous learner run:

```powershell
& 'E:\Document\TicketSim\scripts\real-lab\Stop-PilotRuntime.ps1'
& 'E:\Document\TicketSim\scripts\real-lab\Prepare-PilotRuntime.ps1' -Apply -Refresh
& 'C:\Program Files\TicketSimPilot\scripts\real-lab\Start-PilotRuntime.ps1'
```

The helper checks its recorded mode/PIDs/executable paths and actual SQLite lease/run state. It is not a reset or a reconciliation tool. Do not manually clear rows, journals or leases to make refresh work. If startup failed before a process record or database exists, report that exact boundary instead of broad-killing Node processes.

Evidence paths (outside Git):

- `C:\ProgramData\TicketSimPilot\operator\preparation.json`: principal SID, protected code hashes; no token/password.
- `...\operator\identity-evidence.json`: actual Operator access.
- `...\agent\identity-evidence.json`: actual restricted-principal filesystem/Hyper-V access.
- `...\agent\runtime-evidence.json`: actual Agent Node PID/principal/mode.
- `...\operator\m1-evidence.json`: cross-checked Node owner, probes and verified HTTPS readiness.
- `...\operator\stderr.log`, `...\agent\stderr.log`: startup failures, no request bodies/password logging.
- Pairing link is a **secret** in `...\agent\pairing-link.txt`: open locally with `Open-Pilot.ps1`; do not paste or include it in reports.

## M2: actual read-only browser qualification

At `https://127.0.0.1:4174`, after authenticated pairing:

1. Click **Kiểm tra môi trường**. Require actual preflight PASS, exact original/checkpoint, all retained backup hashes, SSH/HTTP/config checks and resources. This does not consume first-trial approval.
2. Enter the **learner SSH password** directly in the browser form, open the terminal. Require actual pinned-host authentication and a real `lab` shell. Do not provide this password in chat.
3. Use read-only probes such as `hostname`, `id`, `tty`, `ip -4 -o addr show dev eth1`, `stty size`, `systemctl is-active nginx`, `printf 'Tiếng Việt\n'`. Check Ctrl+C on an ordinary read-only `sleep` if needed, pager/editor opening without saving, and resizing.
4. Verify learner repair authorization with read-only `sudo -l`; enter a sudo password only inside the guest PTY if requested. Do not actually start/stop Nginx as a prerequisite test.
5. Refresh the browser and reconnect within the grace period. Require the same terminal session and continued input/output. Verify a second tab cannot acquire another writer. Do not treat a recreated SSH shell after grace expiry as proof that the prior shell survived.
6. Click **Kiểm tra HTTP**; require actual HTTP 200/exact baseline. Preview is escaped text from a fixed backend target, not arbitrary guest HTML rendered in the trusted app origin.
7. Record operator-attributed actual evidence: times, original identity, host fingerprint, checks/results, PTY/refresh/resize/UTF-8 observations, `lab` privileges and zero trial claims/fault/reset attempts. Passwords and raw input are excluded.

M2 code/harness tests cannot stand in for this procedure. Terminal preview expires after ten minutes and does not reserve/claim a live trial; it must not run alongside an active/unknown learner operation or VM lease. New preview creation is blocked during Start/Submit preparation to avoid a baseline-shell race.

## M3 gate remains separate

The default launcher remains terminal-only. `-Mode Trial` is a deliberate separate activation, requiring the exact consent below plus M2 and learner-sudo confirmations. It validates M1 protected evidence, zero prior real runs/claims/actions, no active/unknown lease or operation, exact host/checkpoint/backup and current resource thresholds. The two original draft flags stay false; new protected/shared permit files are created without overwriting an existing admission. Partial admission is retained for operator review. A previously armed unused permit can only resume within its original start window; its window is never extended automatically.

After separate operator consent, close the M2 terminal/tab, then use elevated operator PowerShell:

```powershell
& 'E:\Document\TicketSim\scripts\real-lab\Stop-PilotRuntime.ps1'
& 'E:\Document\TicketSim\scripts\real-lab\Prepare-PilotRuntime.ps1' -Apply -Refresh
& 'C:\Program Files\TicketSimPilot\scripts\real-lab\Start-PilotRuntime.ps1' -Mode Trial -M2Confirmed -LearnerSudoConfirmed -Consent 'APPROVE M3 lab-web-001-first-trial-20261103-001'
```

This consent authorizes exactly one original-VM Nginx-stop fault, actual grading and the exact B5 checkpoint recovery (clean shutdown → restore → boot → independent verification → lease release), including recovery after submission, timeout or failed setup. It does not authorize a second trial, checkpoint creation/deletion or changes to protected/recovery VMs or backup. Consent and admission do not inject a fault: the learner must run fresh preflight/authentication and click Start in the web UI. The admission file blocks later runtime refresh; do not use the terminal-only stop helper once an approved run is claimed.

Starting a new run expires after 60 minutes. Deduplicated queries and the approved recovery of an already claimed run continue to work after that start window. No automatic reset retry was added.

After learner Submit and completion, the Operator can produce the read-only report:

```powershell
& 'C:\Program Files\TicketSimPilot\scripts\real-lab\Inspect-WebTrial.ps1'
```

The report includes immutable grade/note, every grade/baseline check, terminal revocation order, reset-attempt count, operator finalization, current host identities/resources/backup and lease status. It neither edits journals/leases nor retries any VM operation. `livePass` requires actual real-run completion, functional PASS, verified recovery, exactly one reset, finalization and clear lease/work state. A failed learner grade remains failed even when reset succeeds.

Only after M1 and actual M2 PASS, fresh invariants/leases and explicit operator consent for the exact one-run fault/recovery permit may the Operator's protected approval be armed. The default Start mode cannot arm a trial or edit either draft flag. No existing first-trial permit is consumed during code, harness or terminal-only qualification.

Required actual sequence remains: one claim → stop Nginx only → verify HTTP down/SSH up → learner repair in browser → submit once → terminal revoke → independent grade → one exact-checkpoint recovery → independent baseline checks → operator finalization → lease release. Unknown/reset failure is quarantine, never automatic destructive retry. Do not create a second trial to obtain a green report.

## Verification record and limits

- `npm test -- --run`: PASS, 141/141 after M3 admission/report/start-expiry coverage (no actual permit is armed by tests).
- `npm run build`: PASS; terminal assets lazy-loaded; existing main-bundle warning remains.
- Isolated HTTPS/WSS → SSH PTY browser test: PASS, including refresh/reconnect, website check, note autosave and async submit. A repeated three-run check passed after fixing offscreen terminal presentation. This harness uses generated SSH keys and loopback fake guest state, not original VM evidence.
- Full browser regression: PASS, 52/52, including the isolated browser pilot with an active run terminal revoked on submit. All 51 previous paths still pass.
- PowerShell parsing/dry-run passed. Actual principal/runtime launch and guest qualification are still required at the gate described above; account preparation alone is not M1 PASS.

M4 installer/services/runtime distribution, full origin migration, upgrade/uninstall and broader diagnostics remain deferred. The four pre-existing untracked audit files are preserved.
