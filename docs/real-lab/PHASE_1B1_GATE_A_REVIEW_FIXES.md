# Gate A PM review closure — 2026-10-29

Baseline reviewed: `15158b8` (PASS WITH CONDITIONS). Scope: evidence reconciliation, focused operator-script safety fixes, regression and Gate B proposal. **Gate B remains NO-GO.** No real Hyper-V mutation, apply entry point, guest command, VM disk/checkpoint/Netplan/switch/NAT/firewall change or Start Real Lab was executed/enabled. Apply-path testing uses only a mocked reset provider and temporary synthetic files.

## Evidence reconciliation

VERIFIED (new operator elevated evidence): Default Switch Internal `c08cb7b8-9b3c-408e-8e30-5e16a3aeb444`; Lab-Static Internal `4277a35c-217f-4096-a1a9-a691975f150f`; lab1 has two VM adapters; host Lab-Static virtual adapter exists. Codex context still cannot query Hyper-V VM resources. These permission contexts are separate. Exact eth1 MAC-to-switch, eth0 mapping and host binding remain UNKNOWN pending clean operator output. Never infer adapter order. Both IDs are now retained in inventory/network/example config; switch verification flag remains false.

Current read-only sample: 3,745,908 KiB free RAM (~3.57 GiB), below required 2 GiB guest plus 2 GiB host reserve. C free 21,612,126,208 bytes, E free 75,532,447,744 bytes. No suitable additional backup volume observed. Current VM consumption/min/max and current/maximum disk-chain sizes remain UNKNOWN. Evaluate representative workload samples before approving capacity. Fixed startup RAM is preferred for deterministic first pilot; Dynamic Memory requires separate measurement/review. No existing resources were stopped/shrunk/changed.

## Safety review findings and fixes

| Finding | Resolution and evidence |
|---|---|
| Windows ADS/device/alias/traversal forms insufficiently rejected | Ordinary local drive paths only; ADS/device/alias segments fail; canonical overlap and reparse checks preserved; synthetic path regressions |
| Drive letters could alias a shared volume | Capacity aggregation uses actual volume UniqueId; backup cannot share VM or drill volume; aliased-volume regression |
| Journal rewrite could erase prior evidence | CreateNew initial record, append JSON snapshot lines, Flush(true), preserve previous entries; append-history regression; crash still quarantined |
| Restore ID was recorded after rename | Check generated ID and journal it before rename; provision ID journaled before configuration |
| Backup fingerprint only checked for presence | Exact reviewed SHA256 baseline fingerprint required; positive, wrong-baseline and corrupted-file regressions |
| Capacity could change between plan and action | Read again under persistent lease before state-changing operation |
| Restored root config could be ambiguous with checkpoint configs | Select root Virtual Machines vmcx by exact original VM ID; still fail on missing/ambiguous result |
| Memory policy implicit | Future provisioning explicitly disables Dynamic Memory |

Protected lab1 name/ID, collision checks, exact target ID/disk-root binding, new destinations without overwrite, no unrestricted command runner, no automated cleanup and persistent quarantine remain in place. Approval phrase is operator intent only; it cannot replace Product Owner authorization or OS access controls. Reviewed config/state must have operator-controlled ACLs. Backup is preserved on failure. No claim of live Hyper-V qualification, actual recovery or power-loss testing is made.

## Actual verification

| Command/check | Current result |
|---|---|
| `npm run test:browser` | **51/51 PASS in one isolated invocation**, ~1.2m; no concurrent unit/build processes |
| `npm test -- --run` | **94/94 PASS**, 15 files, installed Node 25.1.0 |
| Separate Node 24.22.2, Vitest `--maxWorkers=2` | **94/94 PASS**, 15 files; installed runtime unchanged |
| Preparation/content audit via pretest | 112 tickets/112 Guided cases/122 commands; **0 errors** |
| `npm run build` | PASS; existing large-bundle advisory only |
| PowerShell syntax parser | PASS for operator scripts/module |
| Safety harness through Vitest | **24 assertions PASS**; synthetic files and mocked reset, zero real Hyper-V mutations |

Historical results in PHASE_1B1_GATE_A_QA.md remain unchanged: initial browser 49/51, then targeted 2/2; historical concurrent Node 24 timeout and subsequent bounded 94/94 pass are preserved. Current isolated browser run did not reproduce either failure; concurrency/resource contention is a possible contributor, not a proven cause. No browser timeout/expectation or learning implementation was altered to conceal failures. Isolated Node 24.22.2 qualification was repeated after these fixes and passed as shown above.

## Authorization proposal and changed files

[GATE_B_AUTHORIZATION_CHECKLIST.md](GATE_B_AUTHORIZATION_CHECKLIST.md) separates read-only preparation and individually approved host-changing commands, with expected results and failure responses. Actual image/hash, final reserved IP/MAC, clean binding, exact backup destination and resource approval are still absent; the proposal marks them UNKNOWN instead of inventing values. Candidate 10.77.77.3 is unallocated. The checklist is not permission to create a VM.

Changed: operator module, example config, safety harness/wrapper, HOST_INVENTORY, NETWORK_DESIGN, VM_PROVISIONING_PLAN, BACKUP_RECOVERY, PRIVILEGE_BOUNDARY, original QA addendum pointer, this report, authorization checklist and ROADMAP. Original 112 tickets, Guided/Objective Exam, progress v5 and installed Node runtime remain unchanged. Four pre-existing untracked audit files are preserved. Stop for PM review; no Gate B operation is approved by this closure.
