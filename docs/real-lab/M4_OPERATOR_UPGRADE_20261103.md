# M4 Operator bootstrap and consumed-pilot upgrade

Actual pickup: the Operator ran Apply and received `UPGRADE_STAGE_FAILED`; a second Apply was rejected by `UPGRADE_RECORD_EXISTS_DO_NOT_RETRY`. Actual migration is **not PASS**. Preserve the staged release, upgrade record and any maintenance gate; do not retry, edit its manifest or clear records. The initial generic error hides its cause. The read-only source diagnostic `Inspect-UpgradeFailure.ps1` reports evidence-file encoding/readability, retained stage/gates/events and an independent M3/host recheck without changing them or returning pairing/bridge secrets. Root cause and a reviewed recovery path require that actual output first.

Run the diagnostic in the existing elevated Operator window:

```powershell
& 'E:\Document\TicketSim\scripts\real-lab\Inspect-UpgradeFailure.ps1'
```

This replaces separate manual stage/report queries. It does not alter the immutable failed release, execute upgrade stages or release the gate. Source validation after adding the diagnostic: full unit/content 176/176 PASS, privacy-focused diagnostic tests 2/2 PASS; build PASS.

This source implementation upgrades runtime orchestration only. It never installs guest software, injects a fault, resets a VM, creates a checkpoint or changes a backup. The three new packs remain unavailable. M3's completed run, consumed permit, original approval/actions and first-trial guards remain intact. Actual upgrade qualification is pending Operator execution; unit/browser tests are not evidence that the protected installation has already changed.

## Concrete workflow

Close any learner terminal and old lab tabs. In elevated Windows PowerShell, from the existing checkout:

```powershell
& 'E:\Document\TicketSim\scripts\real-lab\Upgrade-PilotRuntime.ps1'
```

The default is a dry-run description. To perform this one runtime migration:

```powershell
& 'E:\Document\TicketSim\scripts\real-lab\Upgrade-PilotRuntime.ps1' -Apply
```

It prompts for the Windows `TicketSimAgent` credential through the already-qualified launcher on the machine, never in chat. This is installation/startup authorization, not a new live-trial consent. If any step fails, stop and report the error; do not rerun Apply, Stop/Prepare/Refresh, delete the upgrade record or release its gate. No automatic rollback, reset retry or cleanup is implemented.

## Behavior and evidence

1. Verify the actual elevated Operator against the original preparation, old protected code hashes and unchanged dependency lock. Check running-host RAM >=1GiB, E >=15GiB and C enough for the payload plus a 12GiB floor and margin. Resources are observations, not reservations.
2. Stage a new immutable release under `C:\Program Files\TicketSimPilot\releases\<UUID>`. Copy source production modules; reuse the existing protected Node/PowerShell/dependency distribution. Preserve the original installed files and reject redirected roots/links. Hash every staged file, including hidden files, and pin the manifest digest in protected Operator state. No runtime code is copied over running processes.
3. Create the new `control_*` tables, acquire a durable maintenance gate, independently re-verify the exact M3 run `76213ef3-ef9b-4bd2-9cb6-6c508dc2a92c` and current host/backup/resource invariants. Preserve previous M1/process metadata in separate files. A first-trial record already exists and remains consumed; the old web pilot cannot start a second real run. This migration is intentionally specific to that qualified consumed pilot, not a general updater for arbitrary releases.
4. Validate all three recorded actors before stopping any: exact PID, original executable/argument vector, SID and creation time. Exclude console hosts. Capture each process handle and recheck at use; stop only that actor, and verify process/port quiescence. A mismatch or uncertain stop retains the gate. Old admission writers cannot participate in the new gate, so retirement plus the consumed-first-trial guard is required before relying on exclusion.
5. Restart the original unchanged learner runtime explicitly in TerminalOnly through its qualified launcher. This preserves the same HTTPS origin and progress while preventing a new fault/reset permit. Launch the new separate Operator server from its protected release, on `https://127.0.0.1:4176/`. Bootstrap requires a fresh actual elevated token, exact Operator identity/SID and actual read-only Hyper-V access. It verifies the complete release inventory before importing the control plane.
6. Independently verify original M3 history/host again, then perform fresh TLS, process-owner/argument and terminal-only readiness probes. Only after these pass does the migration release its maintenance gate and mark installation complete. It opens the authenticated Operator page without printing a secret. New catalog entries show unavailable; no grant can be issued by this release's null qualified-release resolver.

Protected artifacts under `C:\ProgramData\TicketSimPilot\operator`:

- `m4-upgrade.json`: fixed release/digest, owner, stage and completion timestamps; partial stages are retained.
- `m4-previous-m1.json`, `m4-previous-processes.json`: historical process/identity evidence before retirement, no credentials.
- `m4-readiness.json`, `control-runtime.json`: actual TLS/principal/process qualification, no credentials.
- `actions.sqlite`: old rows unchanged, additive control journal/stage events and durable gate.
- `control.stdout.log`, `control.stderr.log`: bounded startup diagnostics; not credential reports.
- `control-pairing-link.txt`, `control-reopen-token`: **secrets**, Operator-only; never paste, commit or include in diagnostics.

## Reopen after installation

Use the installed release's `scripts\real-lab\Open-Operator.ps1` under the actual Operator. It checks the protected release inventory and exact process owner; starts the control server if absent, otherwise verifies it, then opens the page. A five-minute session can be re-paired without restarting the runtime. A separate long random recovery capability exists only in Operator-private state; learner cookies and bridge tokens cannot use it. Reissue publishes a link locally, never a pairing secret in HTTP output. Active sessions reopen normally without rotating their identity.

Example, after successful installation only:

```powershell
$release = (Get-Content 'C:\ProgramData\TicketSimPilot\operator\m4-upgrade.json' -Raw | ConvertFrom-Json).releaseRoot
& (Join-Path $release 'scripts\real-lab\Open-Operator.ps1')
```

The original learner runtime still uses its existing launcher. Automatic services, desktop shortcuts, a general updater/uninstaller and distribution to another host are later M4 work. No guest-bootstrap transport or new scenario is made executable by this migration.

## Validation scope

Source tests cover complete inventory hashing, changes/extra/missing/hidden files, path escapes/case aliases/junctions, actual-token result validation, stale/mismatched readiness, source-entry refusal, native Windows argument parsing and installer dry-run with mutation functions blocked. HTTPS tests cover protected re-pair and reject weak recovery capabilities. These tests do not kill an actual process or install on the real host. Actual acceptance still needs the elevated run, final readiness evidence and a browser check that M3 history remains and all new packs are unavailable.
