# Phase B content review — topics 06–10

Authored review, 2026-10-23. This is a case-by-case reading of prompts, all answer options/feedback, initial command outputs and their limitations. It is not a claim that a real VM, registrar or customer system was queried. Commands shown in evidence were never executed.

## B1 representative cases

| Ticket | Topic / level | Review | Changes and technical reasoning | Open issues |
|---|---|---|---|---|
| VPS-06-001 | VPS lifecycle / L0 | Technical + editorial; changed | Distinguishes Powered Off, shutdown event, owner intent and post-start service verification; all five questions and initial probe explanations rewritten. | Provider panel records are authored snapshots, not a vendor API specification. |
| VPS-07-005 | Web / L2 | Technical + editorial; changed | Compares served cert/SNI with UTC and deployment status; x509 `-dates` example includes both dates. Corrected date command documentation link to existing `date-utc`. | No live certificate or chain is fetched; hostname/SAN/chain validation remains a required follow-up. |
| VPS-08-003 | DNS / L1 | Technical + editorial; changed | Manually authored pilot also reviewed. Clarifies resolver NS, edited zone and registrar delegation as separate sources. The evidence question explicitly limits itself to the first two sources so the later registrar probe does not make an unselected option accidentally true. | Cache expiration is not simulated. |
| VPS-09-007 | Security / L3 | Technical + editorial; changed | Accepted SSH event differs from failed attempt; IP does not identify actor. Preserves audit evidence and security escalation. Replaced abbreviated fingerprint with a structurally plausible SHA256 sample in both copies of the event. | Attribution/forensics cannot be established by these four records alone. |
| VPS-10-005 | Virtualization / L2 | Technical + editorial; changed | Distinguishes missing host attachment from absent guest device and volume deletion. Replaced editorial `vda 25G only` with a minimal lsblk table. Requires correct volume ID and integrity/application check after host-team action. | No data-integrity or reattachment success is asserted. |

Source tickets, question IDs, option IDs, grading keys, aliases, required probes and hidden mode data are not edited by this module.

## References used

- [libvirt virsh manual](https://libvirt.org/manpages/virsh.html): domain power state, block-device attachment inspection and scope of hypervisor control.
- [Nginx documentation](https://nginx.org/en/docs/): service/vhost and served certificate configuration.
- [OpenSSL s_client](https://docs.openssl.org/3.0/man1/openssl-s_client/) and [x509](https://docs.openssl.org/3.0/man1/openssl-x509/): `-connect`, `-servername`, `-noout`, `-dates` and endpoint evidence.
- [BIND dig manual](https://bind9.readthedocs.io/en/v9.18.41/manpages.html#dig-dns-lookup-utility): NS queries and selecting an explicit server.
- [OpenSSH manuals](https://www.openssh.com/manual.html): authentication events and fingerprint semantics.
- [journalctl manual](https://www.freedesktop.org/software/systemd/man/latest/journalctl.html): unit/time filtering and limits of a log query.
- [lsblk manual](https://man7.org/linux/man-pages/man8/lsblk.8.html): device listing and default output columns.

## Guided-only output corrections at B1

| Ticket / probe | Reason |
|---|---|
| VPS-07-005 / P1 | `openssl x509 -noout -dates` prints notBefore and notAfter; retain expiry and add the other date in the authored sample. |
| VPS-08-003 / P1 | A semicolon-separated list is not normal dig output; render NS records under a DNS status/answer header. |
| VPS-09-007 / P1, G1 | The old fingerprint was visibly abbreviated; use the same 43-character SHA256-shaped sample for both copies of the event. |
| VPS-10-005 / P1 | `only` was editorial prose presented as stdout; use a table with NAME/MAJ:MIN/RM/SIZE/RO/TYPE/MOUNTPOINTS. |

## B2 continuation: topics 06, 07 and 10

This continuation is an authored content review. The other topic 08 and 09 editorial passes are tracked by separate reviewers and must be integrated before claiming the full 40-case pass. The table records the actual technical boundary checked for each case; it is not a live infrastructure test.

| Ticket | Technical boundary checked | Remaining limitation |
|---|---|---|
| VPS-06-002 | High guest CPU coincides with an active backup; asks for impact and owner coordination before any reboot. | One CPU snapshot cannot attribute all latency. |
| VPS-06-003 | Console access and CentOS Stream 9 image do not grant credential reset authority; owner verification remains pending. | No real identity verification is simulated. |
| VPS-06-004 | Reinstall warning, backup inventory and restore test are separate checks; no destructive action is proposed. | No verified backup exists in the fixture. |
| VPS-06-005 | Emergency mode, fstab UUID, blkid and attached volume require identity check before repair. | UUID mismatch does not establish why it changed. |
| VPS-06-006 | ISO boot order explains rescue entry while recovery task and disk health remain open. | OS disk health is not proven. |
| VPS-06-007 | Console gateway 502 and QEMU heartbeat support a control-plane issue, while guest health remains unknown. | Heartbeat cannot establish app health. |
| VPS-06-008 | ACPI sent without completion, stopping state and write latency require host and owner review before force stop. | Pending writes and filesystem condition are unknown. |
| VPS-07-001 | Connection refused, stopped Nginx and absent port 80 listener describe TCP failure; syntax test does not explain the stop. | Start requires authorized review of cause and logs. |
| VPS-07-002 | HTTP 403 and directory index forbidden do not prove an index file is absent. | Deployed files, route and access policy require inspection. |
| VPS-07-003 | HTTP 404, disk config root and release path support a mapping hypothesis, with Host header and active vhost still to confirm. | On-disk config may differ from running config. |
| VPS-07-004 | Nginx active with upstream connection refused narrows the failure to target or backend availability. | A refused connection alone does not distinguish those causes. |
| VPS-07-005 | Served cert expiry is compared with UTC and panel inventory without equating inventory with deployment. | SAN and chain must still be checked from client. |
| VPS-07-006 | App restart loop and missing APP_CONFIG in journal justify app startup investigation; no secret value is displayed. | Readiness and release environment require owner review. |
| VPS-07-007 | SNI-selected CN and dumped default vhost are clues; SAN, chain and active vhost are required before claiming mismatch. | A CN alone cannot rule out coverage by SAN. |
| VPS-07-008 | Nginx response-header timeout, one 31.4-second local request and peak metrics support a slow backend path. | CPU, database, queue and dependency have not been isolated. |
| VPS-10-001 | Panel and domstate agree VM is off; node incident has pending storage consistency review. | Start and data condition need incident owner decision. |
| VPS-10-002 | Guest loopback and host inventory without vNIC suggest missing attachment, not a route-only problem. | Host mapping and guest driver remain to check. |
| VPS-10-003 | Actual host bridge differs from assigned bridge; host network team must verify MAC and network mapping. | Guest firewall has not been examined. |
| VPS-10-004 | Guest steal time, node CPU-ready alert and several affected VMs support host contention. | No VM or process causing contention has been identified. |
| VPS-10-005 | Guest and host disk lists omit vdb; migration task says attach skipped and inventory retains vol-72. | Reattach and data integrity have not been verified. |
| VPS-10-006 | Snapshot creation predates restore completion; file mtime and newer untested backup define a data recovery investigation. | Mtime does not quantify missing transactions. |
| VPS-10-007 | Packet loss overlaps migration and destination bridge-learning warning. | The exact switch, ARP entry or configuration fault is unknown. |
| VPS-10-008 | CentOS Stream 9 guest reports unsynchronized clock and inactive chronyd; guest UTC output is available. | No same-time trusted host UTC establishes the size of drift or sole TLS cause. |

The 07-007 and 07-008 learner-facing text was rewritten fully because joined words obscured technical meaning. Several correct labels in topic 06 were shortened to reduce answer-length cues. Distractor commands in topic 06 and 07 were adjusted toward plausible neighboring checks. These are editorial and fixture reviews, not a claim that the browser flow, unit suite or build has passed.

## B2 continuation: topics 08 and 09

The following 16 records complete the case-by-case technical inventory for this module. The separate topic 08 and 09 editorial patches still need integration and validation in the final build.

| Ticket | Technical boundary checked | Remaining limitation |
|---|---|---|
| VPS-08-001 | A record seen at one resolver differs from new VPS allocation; asks for authoritative answers and cutover plan. | One resolver does not represent every client or authoritative server. |
| VPS-08-002 | `ww` and `www` are distinct DNS names; NXDOMAIN applies to the exact queried name. | The owner must confirm whether `ww` is intentional. |
| VPS-08-003 | Resolver answer, edited zone and registrar delegation are different sources; initial evidence question uses only sources available at that gate. | Cache and delegation propagation are not simulated over time. |
| VPS-08-004 | HTTP by IP succeeds while DNS query times out; timeout is not a negative DNS answer. | Resolver path and authoritative record condition remain unknown. |
| VPS-08-005 | New authoritative answer differs from a recursive cache with remaining TTL. | Not every authoritative server or resolver was queried. |
| VPS-08-006 | A, AAAA and panel IPv6 allocation must be compared separately. | IPv6 reachability and zone authority still require confirmation. |
| VPS-08-007 | SMTP egress IP PTR and forward A are separate checks; reverse zone ownership affects the fix. | PTR alone does not establish deliverability or mail policy compliance. |
| VPS-08-008 | SERVFAIL with validation and NOERROR with checking disabled point toward DNSSEC validation; key fixture uses an algorithm-compatible sample. | DS, DNSKEY, RRSIG and trusted time must be checked before changing delegation. |
| VPS-09-001 | Failed SSH login attempts differ from accepted logins; `last` is a limited cross-check. | Short log excerpts cannot certify that compromise did not occur. |
| VPS-09-002 | Office egress IP matches a jail ban event; asks for failure reason and ban expiry. | The ban's legitimacy and duration are not yet proven. |
| VPS-09-003 | SELinux Enforcing plus a matching AVC and backend listener support a policy investigation. | Intended access and event time correlation need owner confirmation. |
| VPS-09-004 | An unfamiliar privileged account and sudo entry require provenance and activity review before action. | Account name alone cannot establish actor or authorization. |
| VPS-09-005 | SMTP socket and traffic spike identify investigation scope, not message content or malware. | Security team needs process, message and authorization evidence. |
| VPS-09-006 | Provider mitigation and upstream null route explain public reachability scope. | Traffic spike alone does not establish an attack or false positive. |
| VPS-09-007 | Accepted root SSH event is distinct from failed attempts; preserve logs and investigate key ownership. | IP and fingerprint do not establish the human actor. |
| VPS-09-008 | Cron schedule, recurring process and hash difference suggest a persistence mechanism to investigate. | Hash mismatch and recurrence do not prove maliciousness. |

## Additional Guided-only fixture notes

| Ticket / probe | Existing or new correction | Remaining interpretation |
|---|---|---|
| VPS-07-001 / P2 | New local `ss` table replaces editorial `no :80 listener`. | The table shows an SSH listener and no listed HTTP listener; it does not show why Nginx stopped. |
| VPS-07-003 / P2 | The Guided base fixture already replaces `intended deploy` prose with a Nginx server block. | The dump represents on-disk config, not necessarily active runtime. |
| VPS-07-007 / P2 | The Guided base fixture already replaces the word `missing` with a concrete `nginx -T` excerpt. | The excerpt lacks a shop vhost but cannot establish SAN coverage or every running endpoint. |
| VPS-08-006 / P2 | The Guided base fixture already returns only the AAAA record; panel allocation is a separate probe. | DNS publication alone does not prove IPv6 reachability. |
| VPS-10-004 / P2 | A structured node metric replaces an editorial saturation description. | The alert is a panel record, not guest stdout. |
| VPS-10-005 / P2 | The Guided base fixture already replaces parenthetical `(no vdb)` with a `domblklist` table. | Missing attachment does not mean the storage volume was deleted. |
| VPS-10-006 / P2 | A `stat` excerpt replaces the editorial word `expected`. | Mtime is file metadata, not a transaction log. |
| VPS-10-008 / P2, G1, G2 | Removed a host-time annotation from `date -u`; replaced Ubuntu/timesyncd with CentOS Stream 9/chronyd for this guest. | Clock synchronization is suspect; drift magnitude still needs a trusted comparison. |
