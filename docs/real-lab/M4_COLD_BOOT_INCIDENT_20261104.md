# M4 approved original boot — guest firewall drift, 2026-11-04

## Current blocker: fresh continuation probe JSON parse

After actual separate verification PASS, the Operator ran Continue Apply. It stopped with `SyntaxError` at `fresh_repaired_baseline`, `continuationExists=false`, `noStart=true`. Evidence bindings had passed; no marker, runtime start or guest mutation was reached. This output does not identify which JSON boundary failed and must not be labeled a new guest failure, timeout or BOM incident without evidence.

Source now tags the qualified report stdout, Operator draft and qualified host-inspect stdout separately. JSON failures expose only source, byte count, empty/BOM/warning flags and a fixed error code; raw output/parse text is never returned. The independent host inspection uses exactly the original hash-verified protected PowerShell/script, fixed inspect/checkpoint arguments and existing 50-second/8192-byte policy, captures its raw JSON boundary and never retries. Valid surrounding whitespace/UTF-8 BOM is accepted; empty or malformed JSON still blocks. Installed immutable code/failed records/expected hashes are not edited.

The current elevated Operator action is inspection only:

```powershell
& 'E:\Document\TicketSim\scripts\real-lab\Continue-RetiredUpgrade.ps1' -Inspect
```

Inspect and Apply are mutually exclusive. Inspect performs the full evidence/current baseline/actor/port checks and returns before any marker creation or startup. If JSON still fails, retain its source/shape metadata for diagnosis. Do not repeat Apply or any guest mutation until this read-only path qualifies. Actual inspect output and runtime migration remain pending; the separately recorded baseline PASS and both historical failures remain intact.

## Actual separate verification recorded — PASS

The Operator ran the corrected `Confirm-RepairedBaseline.ps1 -Record` and supplied `recorded=true`, `readOnlyProbes=true`, `failedRecordsUnchanged=true`, `maintenanceGateRetained=true`. Verification is `verified=true`, historical M3 `livePass=true`, exact run `76213ef3-ef9b-4bd2-9cb6-6c508dc2a92c`, original `2b9c2170-9a23-4d08-b82e-29929afa4c10`, checkpoint `e6d04330-142c-4397-8e0d-ddf5a9e69090`. All required preflight checks passed: host/target/protected/recovery/checkpoint, B5 proof, backup/resources, service-key SSH authentication and pinned host key, configs/service/page/network/firewall hashes, route and HTTP exact content. `nginxStopped=fail` and `httpUnavailable=fail` are correct for the healthy state: they are extra fault-only conditions, not required preflight failures.

The separate digest-linked verification record exists; failed boot and repair bytes remain preserved, and no guest mutation was repeated. This establishes current repaired baseline readiness, not cold-boot/post-reset persistence. Do not repeat Record, boot, repair or reset. Runtime migration is still not installed/qualified; the next already-authorized step is guarded `Continue-RetiredUpgrade.ps1 -Apply`, which rechecks evidence/current guest baseline, starts only the terminal-only learner plus separate Operator page, and releases maintenance only after actual role/process/TLS/readiness checks. Its local Windows TicketSimAgent password prompt is distinct from learner SSH/sudo authentication.

## Latest wrapper fix before any reconciliation work

The Operator invoked `Confirm-RepairedBaseline.ps1 -Record`; it stopped assigning the installation object to `$record`. PowerShell variable names are case-insensitive, so `$record` resolved to typed switch parameter `$Record` and conversion failed. No verifier process, reconciliation evidence write, guest mutation or gate release was reached. Source renames the object to `$upgradeRecord` and its references; the same verification-only command is still the next action after source checks.

The native regression now executes the script's actual parameter declaration together with its actual installation-record assignment under `-Record`, using a synthetic read-only record getter and omitting protected/elevated operations. It passes on PowerShell 7 and Windows PowerShell 5.1; the previous implementation fails this path. A read-only AST scan found no remaining switch-parameter assignment collisions across the real-lab scripts. Existing dry-run/AST checks alone had not exercised this typed binding. Both failed guest-operation records remain unchanged; protected full reconciliation is still pending.

## Latest actual pickup: repair consumed, Operator verification transport corrected

The Operator executed the approved one-time firewall repair. SSH returned normally and the verifier reported original M3 `livePass=true`, all host/checkpoint/backup/resource checks PASS and HTTP status/content PASS, but service-key `sshAuthentication=unknown` and all dependent guest probes unknown. The helper therefore retained the repair as failed-quarantined at `ssh_returned`. Do not rerun the mutation. Both original failed records must remain byte-identical.

Independent read-only probes immediately afterward authenticated with the original Operator service key (`E:\TicketSimOperatorState\b5\agent-key`) and pinned original known-hosts file, and all guest configuration/page/network/firewall hashes plus exact HTTP passed. Host/backup checks were not supplied to that isolated guest-only collection, so it is not a full independent preflight. The elevated report above separately shows host/backup checks PASS at that point.

Source inspection found that the independent Operator verifier had selected the Agent-owned shared key copy rather than the original Operator key context. Source now uses the explicit original Operator key and known-hosts paths, without fallback, copying a secret or changing ACLs. The actual non-admin pilot keeps its own shared Agent key configuration. The exact OpenSSH stderr for the old shared-key failure was not captured; an owner/actor key-context problem is the supported diagnosis, not evidence that guest SSH was unavailable.

The current reviewed Operator command is verification only:

```powershell
& 'E:\Document\TicketSim\scripts\real-lab\Confirm-RepairedBaseline.ps1' -Record
```

Without Record it is dry-run. Record requires the exact elevated retired Operator and maintenance state, verifies current host/backup/SSH/HTTP/hash checks with the corrected context, and exclusively creates separate `m4-firewall-verification-20261104-001.json` only on full PASS. It hashes both prior failed files before and after the read-only work; neither is rewritten. It neither dispatches another service stop nor boots/resets, changes a key ACL/expected hash, starts runtime services or releases the gate. No password prompt is expected: these are batch service-key probes. On a failed read-only check no new verification file is created; retain diagnostics and do not retry the original mutation.

Continuation can recognize this separate evidence only for the exact known case: prior repair SSH exit 0, failure after SSH returned, prior HTTP already PASS, correct record/target/owner/checkpoint bindings, unchanged raw bytes of both failures and every required current preflight check PASS. Unknown SSH action outcomes and cross-scope/partial evidence remain blocked. Continuation still re-probes the current baseline before startup. Actual protected reconciliation is pending this Operator command's output; temporary runtime restoration does not qualify cold-boot/reset persistence.

Latest source verification: 191/191 unit/content tests and build PASS; native Windows PowerShell 5.1 dry-run/consent/AST checks PASS. Tests preserve both failed byte buffers and reject altered repair digests, wrong bindings, unknown SSH exits and any missing/unknown fresh baseline check. These tests create no protected verification record or actual runtime startup.

## Current approved repair pickup

The user has separately approved exactly one `sudo systemctl stop firewalld` on original, with no disable/permanent-policy/hash change, no reset/retry and separate verified evidence. This supersedes the pending-approval wording in the historical diagnostic notes below. No repair has been executed by Codex. The reviewed Operator command is:

```powershell
& 'E:\Document\TicketSim\scripts\real-lab\Restore-ApprovedGuestFirewallBaseline.ps1' -Apply -Consent 'APPROVE M4 original stop firewalld once 20261104'
```

Run in elevated PowerShell. Without Apply the helper is dry-run; wrong consent is rejected before protected-state access. It verifies exact retired owner/release/principal, original Node/PowerShell hashes, immutable release inventory, gate/no pending work/no continuation, failed boot binding, fresh actual M3/host/backup/resource invariants and pinned SSH known-host fingerprint. It durably creates Operator-private `m4-firewall-runtime-restore-20261104-001.json` before one fixed learner SSH dispatch. The only remote command is `systemctl is-active --quiet firewalld && sudo systemctl stop firewalld`; local SSH/sudo prompts receive credentials directly, never in chat or an application log. Existing reservation blocks duplicates, including after cancellation or an ambiguous SSH result.

After a zero SSH exit it rechecks maintenance state and runs the existing independent full baseline verifier, including exact HTTP bytes and original firewall hash. Failure keeps the repair record quarantined, original failed boot bytes unchanged and maintenance held; there is no reset/restart/second stop fallback. Success stores the full read-only verification in the separate repair record with the original boot's raw-byte SHA256 and Operator attribution. The helper does not rewrite the boot record, update expected hashes, start pilot services or release the gate.

`operator/bootRecovery.mjs` recognizes only this exact verified repair scope, matching failed boot digest/owner/target/checkpoint, successful SSH exit, coherent timestamps and every required preflight check PASS. Source continuation then independently re-runs current guest/host baseline checks; a stale verified record cannot by itself permit startup. Partial/failed/cross-owner/cross-target/drifted records and unknown checks block. Actual repair, reconciliation and installation readiness remain unqualified until Operator output. Even a successful temporary repair does not qualify cold-boot/post-reset persistence, which remains an M4 acceptance blocker.

Source verification: 189/189 unit/content tests and build PASS. Native Windows PowerShell 5.1 process-policy/dry-run/consent/AST harness also PASS. These checks execute no guest mutation, boot/reset, actual process stop or protected-state installation.

## Actual outcome

User separately approved exactly one original boot. The corrected guarded helper passed dependency integrity and both retired-admission checks, reserved the single-use operation, called Start-VM and confirmed Running. It then failed with `BOOT_HTTP_READINESS_TIMEOUT_DO_NOT_RESET` after its 90-second HTTP readiness window. Per the helper's source order, it retained `m4-original-boot-20261103-001.json` as failed-quarantined; protected contents have not been independently read back by Codex. No second boot, reset, fault, guest service change or gate release was executed.

Upgrade remains retired with the existing maintenance owner `6c54ee60-4c6e-4183-9d38-0362be18b3c4`; latest Operator-supplied protected diagnostic before boot established that owner/phase and clear work. Boot approval is now consumed. Do not rerun the boot helper, edit its failed record, clear the gate, run continuation or change expected baseline hashes to bypass the failure.

## Independent read-only observations after timeout

| Signal | Actual evidence |
|---|---|
| Original | `2b9c2170-9a23-4d08-b82e-29929afa4c10`, ticketsim-lab, Running, Hyper-V status Operating normally, uptime about 2 minutes at initial observation |
| Protected VMs | lab1 and recovery Off |
| Network | management MAC `00155D380102`, host Lab-Static address `10.77.77.1/24`, neighbor `10.77.77.3` Reachable at the expected MAC |
| Guest identity | strict-known-host service-key SSH returned ticketsim-lab and `eth1 10.77.77.3/24`; pinned ED25519 fingerprint still `SHA256:8LJ5bycBjgnfgRXp5tFh1jV/BGrfvb41rQQnzfbVi3U` |
| Nginx | active; nginx config test successful |
| Guest baseline checks | SSH config, Nginx config/service, page hash, Nginx config hash, Netplan hash, cloud-init hash, SSH config hash and management route PASS |
| HTTP | direct host curl with proxy bypass timed out connecting to `10.77.77.3:80`; independent LiveOperations HTTP checks unknown |
| Firewall | nft ruleset contains `table inet firewalld`; public input allows TCP/22 and rejects other unmatched input; no TCP/80 allow was observed |
| Normalized firewall SHA256 | actual `aa0883014841a86f6599e0a0cccae1966fe15fc1c77c7b4c0eef4638a50eb1dd`; retained draft baseline `01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b`; mismatch |

Guest probes used only the existing forced-command service account and fixed read-only action IDs. The isolated guest-check collection supplied no host bridge inspection; its host/backup/resource checks are unknown and must not be presented as a full preflight PASS. The qualified planner already checked all four backups and boot resource floors before the approved boot; this investigation does not claim a fresh independent full backup verification afterward.

The firewall policy is an observed blocker/inconsistency, not an Nginx stopped-service fault. The exact firewalld service enablement, persistent zone policy, port-80 listener and startup ordering still need the requested learner-authenticated read-only inspection. Do not assert why the rules changed or that they were changed by a learner. Historical B5/M3 PASS evidence remains intact; it does not prove current cold-boot readiness or long-term baseline stability.

## Learner-authenticated read-only inspection received

The user ran the requested read-only SSH/sudo inspection locally. It confirms firewalld `active`, unit `enabled`, `ActiveEnterTimestamp=Tue 2026-11-03 17:08:01 UTC` (2026-11-04 00:08:01 Asia/Saigon). Nginx listens on both `0.0.0.0:80` and `[::]:80`. Active zone is public. Both runtime and permanent public policy list only `dhcpv6-client ssh`, no additional ports and no rich rules. This closes the service/listener/policy uncertainty above: the firewall excludes HTTP despite a running listener. It does not establish when or by whom permanent policy was configured.

The concrete temporary repair proposal is exactly one `sudo systemctl stop firewalld` on the pinned original guest. This stops the guest firewall and may remove its managed rules (subject to actual daemon configuration); it does not disable startup, edit permanent zone policy or change expected hashes. It is proposed solely to restore the existing empty-ruleset baseline, and must be verified afterward rather than assumed. Full current HTTP/SSH/host/backup/hash checks are mandatory; any remaining rules or failed check keeps quarantine. This is not a persistent reboot/reset repair and cannot qualify M4 stability. A separate approval for this one guest mutation has been requested and is pending; the consumed boot consent does not cover it. No stop command has been executed, and no automatic restart/reset/retry is authorized.

If approved, reserve the action durably before dispatch, keep the failed boot record byte-identical and attach separately verified reconciliation evidence only after the full independent checks. Do not manually flip the boot status to verified or release maintenance from a stale result. Restoration of firewalld, if later needed, requires its own approval. Cold-boot/post-reset lifecycle handling remains a required explicit M4 plan item regardless of success of this temporary repair.

## Repair boundary and next steps

1. Obtain the requested read-only firewalld active/enabled timestamps, active/permanent zone policy and port-80 listener. The fixed service dispatcher cannot obtain arbitrary additional systemctl/firewall-cmd/ss output; do not bypass it or extend it on the guest without approval. The learner can enter their SSH/sudo password locally, never in chat.
2. Present an exact, separately approved guest repair. Merely opening HTTP under the current firewall will not restore the retained firewall hash. Stopping a firewall, changing its startup policy, adding HTTP rules, deploying a bootstrap, replacing a baseline/checkpoint, or resetting are not authorized by the one-boot consent. Do not choose one silently or disable hash verification.
3. After an approved repair, independently recheck current host/backup invariants and all guest baseline checks including exact HTTP bytes and firewall hash. Preserve the failed boot record and append separate, reviewable reconciliation evidence; do not rewrite the failed status to verified. A reviewed continuation gate must recognize that separate evidence before installation can resume.
4. Qualify cold-boot/post-reset policy stability as a real M4 acceptance requirement before claiming a usable packaged lab. A transient repair alone is not evidence of persistence. Preserve the existing one checkpoint, cold backups, other VMs, consumed M3 permit and all 112 tickets/progress.

At this checkpoint no repair, reconciliation, new trial or runtime startup is authorized/executed. The 186-test/build source result preceding this event is not actual guest recovery evidence.
