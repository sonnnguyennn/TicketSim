# M4 Operator bootstrap and consumed-pilot upgrade

## Current pickup: baseline verified, continue runtime migration

Actual Operator output now confirms separate verification recorded, all required current baseline checks PASS, historical M3 PASS, both failed records unchanged and maintenance gate retained. The extra fault-only `nginxStopped`/`httpUnavailable` checks correctly fail in a healthy baseline. The next already-authorized command in elevated PowerShell is:

```powershell
& 'E:\Document\TicketSim\scripts\real-lab\Continue-RetiredUpgrade.ps1' -Apply
```

This helper still refuses an existing continuation attempt or any present runtime actor/listener; verifies immutable release, same gate and digest-linked reconciliation plus a fresh full baseline; then starts TerminalOnly learner and separate zero-qualified-pack Operator control. Enter the Windows TicketSimAgent password locally, not learner SSH password and never in chat. No VM-changing operation is performed. On failure retain state and report, without repeating Apply/Resume/Stop/Refresh or any guest mutation. Actual migration/browser acceptance and cold-boot/post-reset stability remain pending; the baseline verification is not M4 completion.

## Current action: verify repaired baseline without repeating the mutation

The approved firewalld stop ran once and HTTP exact content recovered. The Operator verifier then failed its service-key probes; independent probes using the original Operator key pass all guest checks. Source corrects the verifier's key context without changing Agent key ACLs. Run only the verification-only `Confirm-RepairedBaseline.ps1 -Record` described in the [incident report's latest pickup](M4_COLD_BOOT_INCIDENT_20261104.md). It creates separate digest-linked verification after full current PASS, retaining both failed boot/repair files and maintenance gate. Do not repeat boot or repair. Unknown mutation outcomes cannot be reconciled through this branch. Runtime continuation waits for actual full verification; cold-boot/reset persistence remains unqualified.

## Latest pickup: one temporary firewall stop approved, not yet executed

The user approved exactly one guest `systemctl stop firewalld` on original. Use the guarded `Restore-ApprovedGuestFirewallBaseline.ps1` command in the [incident report](M4_COLD_BOOT_INCIDENT_20261104.md), with local learner SSH/sudo authentication. It reserves once, preserves the failed boot bytes, independently verifies all baseline checks and writes separate repair evidence without releasing maintenance. Source continuation accepts that evidence only with correct digest/scope and fresh independent guest/host verification. Do not run the old boot helper or manually change the failed record. No repair or runtime startup has been performed by source tests; permanent reboot/reset stability remains unqualified.

## Current blocker: approved boot consumed, HTTP timeout and firewall drift

Latest diagnostic closes the guest uncertainty: learner-authenticated read-only output confirms firewalld active/enabled, Nginx listening on IPv4/IPv6 port 80, public active zone and runtime/permanent policy allowing only ssh/dhcpv6-client. A separately scoped one-time stop-firewalld proposal is pending user approval; no guest repair has run. It is explicitly temporary and cannot establish cold-boot persistence. See the incident report's received diagnostic and proposal before any older command below.

The user ran the corrected boot helper: it called Start-VM once, confirmed Running, then failed `BOOT_HTTP_READINESS_TIMEOUT_DO_NOT_RESET`. Independent fixed-target read-only probes confirm SSH/identity/host key, network route, Nginx/config/page hashes PASS, but the guest firewalld rules permit SSH only and the normalized firewall hash differs from baseline. See [actual cold-boot incident](M4_COLD_BOOT_INCIDENT_20261104.md) for exact observations, limits and next steps. The original is Running; do not boot/reset it again. Keep the failed boot record and maintenance gate. Current continuation correctly refuses that failed record. Learner-authenticated read-only firewalld/persistent-policy/listener inspection is requested before presenting an exact separately approved repair. No repair or baseline-hash change is authorized by the consumed boot approval. Prior commands below are historical until this incident is reconciled; do not rerun them.

## 2026-11-04: boot precheck expected an uninventoried module hash

The approved boot helper stopped at `QUALIFIED_BOOT_DEPENDENCY_HASH_CHANGED`, before retired admission, reservation or Start-VM. Source inspection found an implementation error: original `Prepare-PilotRuntime.ps1` inventories Node and PowerShell but never inventories `scripts/real-lab/FastReset.Operator.psm1`. Comparing its actual hash to that missing property incorrectly reported a changed dependency. The generic output alone does not prove any installed file was changed.

The corrected helper still requires Node/PowerShell hashes from original preparation **before** executing either. It then verifies the protected retired release's full inventory/pinned manifest through the existing read-only admission check. Only the legacy module whose preparation entry is absent may use the exact single `scripts/real-lab/FastReset.Operator.psm1` entry in that verified protected release manifest as its comparison anchor. Installed bytes must match; an existing preparation hash mismatch never falls back, and missing/duplicate/malformed manifest entries fail closed. No preparation, installed file, immutable release or expected hash is rewritten. `BootIntegrity.psm1` reports distinct missing/invalid expected hash versus actual mismatch and names the dependency.

The same already-approved boot command below remains the next Operator action after source verification; no VM-changing call or single-use reservation was reached in the reported failure. Existing reservation and retired-state guards remain mandatory. Native tests in both Windows PowerShell 5.1 and PowerShell 7 cover the real hashing of synthetic files, changed-byte rejection, no fallback on preparation mismatch and invalid/missing/duplicate entries; they do not boot a VM. Actual boot/SSH/HTTP qualification remains pending.

## Latest actual blocker: original VM is Off

Update: the Operator diagnostic at `2026-11-03T16:42:36.666Z` confirms active resume `retired`, release `4badc683-0432-4776-90d5-9b206d6e4d27`, same gate owner, last event `legacy_state_rechecked`, `stateClear=true`, one preserved completed real run and exact failure `TRIAL_ORIGINAL_MISMATCH`. The user separately approved **one original boot** after backup/gate/lease/resource checks, with no retry or automatic reset. This approval does not permit any fault/reset/checkpoint action or mutation of other VMs.

The reviewed elevated Operator command for that approval is:

```powershell
& 'E:\Document\TicketSim\scripts\real-lab\Start-ApprovedRetiredOriginal.ps1' -Apply
```

Default is dry-run. Apply pins this exact retired owner/release, verifies its immutable inventory and clear protected state, refuses existing continuation/boot records or running runtime actors, verifies original planner hashes, checks B5 lease absence, hashes all four backups through the qualified planner and enforces boot resource floors, exact Standard checkpoint/disk binding and both protected VMs Off. It durably creates `operator/m4-original-boot-20261103-001.json` before its sole `Start-VM` call. A partial/failed attempt keeps that reservation and is not retryable. It then waits using read-only HTTP probes and verifies the original M3 report plus actual fixed-target service-key SSH/host-key/config/network/HTTP exact-content preflight checks. It never starts pilot services or releases the maintenance gate. Normal continuation refuses an existing boot record unless independently verified; preboot eligibility is explicitly labeled and cannot be used as runtime-continuation approval. Actual boot and qualification remain pending Operator output. No boot has been performed by source tests.

The Operator ran `Continue-RetiredUpgrade.ps1 -Apply`. It passed retired-state eligibility but the original report worker failed at `read_actual_m3_host`, before the exclusive continuation marker or any runtime start. The old report CLI only returned `TRIAL_REPORT_VERIFICATION_FAILED`; this output does not identify its underlying exception. Independent read-only Hyper-V observation then found original `2b9c2170-9a23-4d08-b82e-29929afa4c10` **Off**, with AutomaticStartAction Nothing; recovery and lab1 were also Off. Exactly one expected Standard checkpoint and the same active AVHDX-to-base chain remained. Resource observation: RAM 6552260608 bytes, C 16685789184 bytes, E 37229187072 bytes, all above the boot floors. These are observations, not reservations; the reason the VM was turned off is unknown.

`assertTrialHost` requires original Running, so this actual state is sufficient to block a report even if all retained M3 history passes. Do not weaken that check or treat the retained M3 grade/recovery as failed. The current protected diagnostic is requested to establish the report's exact failure code and stage. Booting original is a new VM-changing operation requiring separate approval under the handoff discipline; before any boot recheck backup, gate/leases, target/checkpoint/disk and resources (RAM >=3GiB, C >=12GiB, E >=15GiB). No boot, reset or runtime start has been performed by this investigation. Continue must remain blocked until current host qualification is restored and verified.

The source eligibility CLI now prints only sanitized stage/failure metadata, never an execFileSync stderr dump. A separate local shell check exposed that unresolved/denied native executable lookup could leave a stale LASTEXITCODE in a nonterminating caller; `Invoke-PilotPowerShell` now makes launch errors terminating and tests missing executable refusal plus environment restoration. Neither change makes the powered-off VM eligible or modifies the immutable deployed release.

## Current pickup: resume retired, credential module failed

Operator output from the actual `Resume-LockedUpgrade.ps1 -Apply` shows process retirement, a successful fresh elevated Operator probe at `2026-11-03T04:48:02.9323799Z`, then `Get-Credential` / `CouldNotAutoloadMatchingModule` in the original launcher. Source order places the failure after the resume record became `retired`, before Agent credential probing or new services started. Protected state still needs to confirm this precise phase; the continuation refuses anything else. The original failed release/record and same maintenance owner remain preserved.

The launcher was called in Windows PowerShell 5.1 after its module path had been set to PowerShell 7 modules. A native cold-shell test reproduces the incompatible Security module failure. `PilotShell.psm1` keeps caller modules aligned to its own host and invokes the unchanged, hash-verified original launcher in the qualified protected PowerShell 7 process. It restores the caller environment when the child exits, including failure. Tests load `Get-Credential` metadata only; they never request a password.

The current reviewed command, in the elevated Operator window, is:

```powershell
& 'E:\Document\TicketSim\scripts\real-lab\Continue-RetiredUpgrade.ps1' -Apply
```

This is not another staging or retirement attempt. Without Apply it is dry-run. Apply checks the hash-linked active record, full immutable release manifest, original launcher hashes, exact owned gate and last `legacy_state_rechecked` event, no grants/attempts/unresolved work, actual original M3 PASS, and absence of runtime actors/listeners. It exclusively creates Operator-private `m4-retired-continuation.json` before starting anything. It starts the original learner TerminalOnly through PowerShell 7, starts the existing staged Operator, and invokes the existing immutable completion verifier. Completion still requires fresh actual M1, TLS, principals, process identity and M3/host checks before gate release. No release is patched or copied, and no process stop, fault/reset, guest setup or checkpoint/backup operation is supplied by this helper.

Enter the Windows TicketSimAgent password only in the local prompt. If any step fails, retain its marker, records, gate and logs; do not repeat this command, Resume, Apply, Stop or Refresh. The marker records the failed stage and blocks a duplicate start. Do not paste pairing links, tokens or passwords. Successful source tests are not actual installation qualification: current regression is 185/185 unit/content tests PASS, including real Windows PowerShell 5.1/7 compatibility and dry-run/AST guards, plus build PASS. Actual continuation and final browser acceptance remain pending.

The following locked-stage procedure is historical for this host; it was already executed and must not be repeated.

## Diagnosed incident and explicit locked-stage recovery

Actual read-only evidence narrowed the failure to the staged host-inspection transport: on 2026-11-03 the cloned release returned empty stdout, `SyntaxError` on JSON parse, elapsed 121069ms, no BOM/warning text and no reported timeout kill. This is **not proof of a timeout** or a VM/backup failure. The underlying reason the cloned PowerShell returned no JSON is not established. The original protected `Inspect-WebTrial.ps1` path independently continues to report actual M3 PASS and correct host state.

Failed immutable release: `c80f2e36-3e09-4df0-896a-71cabf1283d8`, manifest `c9e5b9728973ab6b3e89504380139d5b8e3fab7c0f90a5f17936f4af7a549043`. Gate owner `6c54ee60-4c6e-4183-9d38-0362be18b3c4`. Original record is locked; journal has only maintenance_acquired/maintenance_failed, no old metadata archives, no active work and no runtime retirement. Preserve these artifacts unchanged.

The corrected source uses a hash-verified worker at the **original qualified Node executable, original report script and original PowerShell/module paths** for M3/host inspection. It does not import the old inspector into the staged Node process. The worker's 180-second outer budget does not change the existing inner host action/reset policy. Role/readiness probes use the qualified original PowerShell too. New releases no longer copy another PowerShell distribution. This is an explicit compatibility bridge for this existing installation, not qualification of the failed clone or a standalone installer for another host.

After source tests/build pass, the reviewed recovery command is:

```powershell
& 'E:\Document\TicketSim\scripts\real-lab\Resume-LockedUpgrade.ps1' -Apply
```

This is a separate guarded branch, not rerunning the old Apply or editing its release. Default without Apply remains dry-run. It stages a new release, verifies the old release and exact pre-retirement evidence, retains the **same gate owner without release/reacquisition**, and creates a separate `m4-resume.json` using exclusive creation. That record pins the original record's raw-byte hash and original release/digest. Bootstrap/open/readiness select this resume record only if that chain remains valid; the original `m4-upgrade.json` is never rewritten. Resume refuses advanced phases, archives, extra journal events, foreign gates, unresolved work or any prior resume. Subsequent runtime steps perform fresh M3/identity/process checks before retiring anything. No guest setup, fault/reset or checkpoint/backup mutation is introduced. If resume fails, keep the gate/evidence and do not run it again.

Source now retains the first structured failure stage/code/signal in Operator-private state and prints sanitized classification without child stderr, JSON contents or credentials. Diagnostic `-StagedHost` always targets the **original failed clone**, even after a new resume becomes active; it is not a health check of the corrected compatibility bridge.

The following incident notes describe the preceding diagnostic checkpoints, not instructions to repeat the original Apply:

Historical pickup: the Operator ran Apply and received `UPGRADE_STAGE_FAILED`; a second Apply was rejected by `UPGRADE_RECORD_EXISTS_DO_NOT_RETRY`. Actual migration is **not PASS**. The original generic error hid its cause; subsequent read-only evidence and the recovery design are recorded above. Do not edit the old release/manifest or clear records.

Run the diagnostic in the existing elevated Operator window:

```powershell
& 'E:\Document\TicketSim\scripts\real-lab\Inspect-UpgradeFailure.ps1'
```

This replaces separate manual stage/report queries. It does not alter the immutable failed release, execute upgrade stages or release the gate. Source validation after adding the diagnostic: full unit/content 176/176 PASS, privacy-focused diagnostic tests 2/2 PASS; build PASS.

This source implementation upgrades runtime orchestration only. It never installs guest software, injects a fault, resets a VM, creates a checkpoint or changes a backup. The three new packs remain unavailable. M3's completed run, consumed permit, original approval/actions and first-trial guards remain intact. Actual upgrade qualification is pending Operator execution; unit/browser tests are not evidence that the protected installation has already changed.

## First-time workflow (historical for this incident; use reviewed resume above)

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
2. Stage a new immutable release under `C:\Program Files\TicketSimPilot\releases\<UUID>`. Copy source production modules, protected Node and dependencies; use the existing qualified PowerShell in place. Preserve the original installed files and reject redirected roots/links. Hash every staged file, including hidden files, and pin the manifest digest in protected Operator state. No runtime code is copied over running processes.
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
$recordFile = if (Test-Path 'C:\ProgramData\TicketSimPilot\operator\m4-resume.json') { 'C:\ProgramData\TicketSimPilot\operator\m4-resume.json' } else { 'C:\ProgramData\TicketSimPilot\operator\m4-upgrade.json' }
$release = (Get-Content $recordFile -Raw | ConvertFrom-Json).releaseRoot
& (Join-Path $release 'scripts\real-lab\Open-Operator.ps1')
```

The original learner runtime still uses its existing launcher. Automatic services, desktop shortcuts, a general updater/uninstaller and distribution to another host are later M4 work. No guest-bootstrap transport or new scenario is made executable by this migration.

## Validation scope

Source tests cover complete inventory hashing, changes/extra/missing/hidden files, path escapes/case aliases/junctions, actual-token result validation, stale/mismatched readiness, source-entry refusal, native Windows argument parsing and installer dry-run with mutation functions blocked. HTTPS tests cover protected re-pair and reject weak recovery capabilities. These tests do not kill an actual process or install on the real host. Actual acceptance still needs the elevated run, final readiness evidence and a browser check that M3 history remains and all new packs are unavailable.

Current source regression for the transport/resume fix: 183/183 unit/content tests PASS with two workers; build PASS. Tests reject advanced/cross-owner/dirty recovery, preserve the original record hash, retain the same gate owner, select the original Node/report/PowerShell worker and block loading on integrity failure. Dry-run of `Resume-LockedUpgrade.ps1` performs no machine mutation. Actual resume remains pending.
