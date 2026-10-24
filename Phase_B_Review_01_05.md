# Phase B review — VPS topics 01–05

This review covers 40 Guided cases (VPS-01-001 through VPS-05-008). The case-specific authoring is in `scripts/content/phase-b-01-05.mjs`. All 40 have reviewed customer context, hints, initial and related probe explanations, option labels and feedback, a verification prompt, six answer fields and technical/editorial notes. The module preserves existing question IDs, option IDs, answer keys and evidence gates. The original ticket source is unchanged.

## Case review

| Case | Evidence and conclusion checked | Editorial or safety decision |
| --- | --- | --- |
| 01-001 | Inactive sshd and empty TCP listener table explain refusal, not why sshd stopped. | Read journal/config before authorized start; verify from client. |
| 01-002 | `getent passwd admin` has empty stdout. | Distinguish missing account entry from a bad password. |
| 01-003 | Private key is readable by group and others on the client. | Limit key permissions; do not promise that login then succeeds. |
| 01-004 | Active service does not prove listener or applied firewall zone. | Compare active zone and TCP path before any rule change. |
| 01-005 | Host key warning follows reinstall, but trust needs independent fingerprint comparison. | Never teach blind `known_hosts` removal. |
| 01-006 | Fail2ban ban identifies one source IP, not whether it is malicious. | Confirm source ownership, auth timeline and policy before unban. |
| 01-007 | Parsed sshd port and runtime listener have different meaning. | Confirm intended port and client command before policy advice. |
| 01-008 | OOM event and memory pressure share a window; direct SSH cause remains unproved. | L3 asks for timeline and owner escalation, not a guessed RAM fix. |
| 02-001 | Internal reachability plus absent default route supports route investigation; panel allocation is a separate fact. | Scope the early evidence question to address and route output. |
| 02-002 | DNS query timeout is not NXDOMAIN, and IP reachability does not prove HTTP. | Inspect active resolver and profile before changing DNS. |
| 02-003 | Link up, IPv4 assignment and NetworkManager profile state differ. | Verify renderer, MAC and allocation after migration. |
| 02-004 | Local HTTPS response and external timeout do not isolate a firewall by themselves. | Check bind, active zone and upstream path before requesting a narrow rule. |
| 02-005 | Panel allocates IPv4 while guest shows no `inet` address; IPv6 remains usable. | The `ip` fixture uses an interface header rather than narration as stdout. |
| 02-006 | MTR and ping show 25% ICMP loss at destination from the customer source; a second source opens TCP/22. | Do not name a failed router; hand comparable samples to network. |
| 02-007 | Tokyo TCP/22 works while two ISP probes time out; guest has listener. | Gather source/time/capture evidence before edge escalation. |
| 02-008 | DF payload 1472 is too large on the tested VPN path, while 1200 succeeds. | PMTU/MSS remains a hypothesis for TCP upload; owner must authorize any change. |
| 03-001 | Nginx service and listener are absent; configuration test and HTTP are separate checks. | Review log/config before start and test customer URL afterward. |
| 03-002 | Upload directory mode 755 and account identity support a permission hypothesis. | Inspect process user, parent path, ACL and mount before a narrow change. |
| 03-003 | `nginx -t` identifies a syntax error near line 45. | Fix with configuration owner, retest syntax, then runtime and HTTP. |
| 03-004 | AVC and SELinux enforcing mode show denial, not necessarily a faulty policy. | Match path, label and intended write before remediation. |
| 03-005 | App dependency and missing DB data path need mount/unit inspection; corruption is unproved. | Protect database data and use owner escalation. |
| 03-006 | Restart loop and Python module error point to release environment mismatch. | Check virtualenv and manifest, avoid system Python installation. |
| 03-007 | FD error occurred; 1008 open of 1024 is a later snapshot. | Trend FD classes and align PID/time before claiming a leak. |
| 03-008 | Root filesystem is read only with EXT4 errors; underlying cause is unknown. | Stop writes and send storage/recovery evidence; no live repair. |
| 04-001 | Process CPU and interval-wide CPU are different measures. | Attribute a workload with owner rather than assume abuse. |
| 04-002 | Available RAM, swap used and swap activity are separate values. | Use interval samples and avoid a leak diagnosis from one snapshot. |
| 04-003 | Kernel OOM kill is established; the memory demand or limit still needs investigation. | Preserve PID/cgroup scope before action. |
| 04-004 | `vmstat` CPU `wa` differs from device-only `iostat -dx` output. | Do not treat iowait as proof of a failed disk. |
| 04-005 | The api container cgroup has throttle counters and a one-CPU quota. | Query inside the container and compare counter deltas. |
| 04-006 | RSS 850000 KiB is about 830 MiB; no code leak is established. | Check process trend and ancestor limits with owner. |
| 04-007 | Guest steal samples and node contention warning support infrastructure escalation. | Do not name a noisy neighbor or self-migrate. |
| 04-008 | I/O latency overlaps a backup window; causality and restore ability are unproved. | Verify customer performance and recovery separately. |
| 05-001 | Block use, log directory use and journal use are different totals. | Locate candidates and protect customer writes. |
| 05-002 | Inodes are exhausted while block capacity remains; file count alone is not a deletion plan. | Check ownership and filesystem type before remedy. |
| 05-003 | Journal usage includes active and archived files; vacuum frees eligible archived data only. | Use retention policy and verify freed space. |
| 05-004 | `/data` is read only and kernel reports I/O error; exact cause is unknown. | Preserve data and escalate to storage; acknowledging incident is not resolution. |
| 05-005 | Disk size grew, but partition and XFS filesystem did not. | Grow each layer only with an authorized, checked plan. |
| 05-006 | An unlinked open file can retain blocks until its process closes the handle. | Coordinate graceful release; recheck `df` afterward. |
| 05-007 | Rescue boot, EXT4 errors and read-only root need recovery planning. | No `fsck` on mounted filesystem, reboot or format by support. |
| 05-008 | VG free extents, LV size and filesystem size are distinct. | Preserve the correct volume order and verify each layer. |

## Focused checks

- `node --check scripts/content/phase-b-01-05.mjs`: passed.
- Import check: 40 case records, 223 question records, 40 six-field answer overrides, and no empty prompt, explanation, option label or feedback.
- Applied all 40 edits to the existing Guided content in memory with `applyGuidedEdits`: passed; no unknown question or option ID.
- Compared authored output changes to `review.fixtureChanges` for these cases: no undocumented fixture override found.
- Reviewed the four source pseudo-outputs explicitly: 01-001/P2 and 03-001/P2 use a realistic empty `ss` table, 01-002/P2 uses empty stdout, and 02-005/P2 uses an interface header without `inet`.
- Correct answer was strictly the longest label in 11/32, 9/32 and 13/32 single-choice questions for topics 01, 02 and 03 after label revision. This is a cue check, not a proof of assessment quality.

Full `npm test -- --run`, browser tests, `npm run build` and the final 112-case audit belong to the integrated Phase B pass after all three content modules are assembled. This file does not claim those gates have passed.
