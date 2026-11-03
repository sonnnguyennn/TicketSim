# M4.1c protected runtime migration — actual PASS, 2026-11-04

## Result and scope

The Operator completed the guarded retired migration and supplied its output plus actual learner/Operator browser screenshots. M4.1c runtime migration/readiness is PASS. This does not mark all of M4 complete, qualify a new scenario, authorize another learner fault/reset or establish reboot/reset stability.

Active protected release: `C:\Program Files\TicketSimPilot\releases\4badc683-0432-4776-90d5-9b206d6e4d27`, manifest `8fcc93eadc1224f06a8a0547ebafb7c0e22a52b4bd9303c90f0d569ce29c490c`. Original maintenance owner: `6c54ee60-4c6e-4183-9d38-0362be18b3c4`. The original failed release/record and hash-linked resume chain remain preserved; source helper commits do not overwrite that immutable installed release.

## Actual evidence

| Check | Evidence and attribution |
|---|---|
| Read-only eligibility | Operator's preceding Inspect returned eligible=true, retired, livePass=true, runtime actors absent, no continuation marker created, no services started |
| Current repaired baseline | Separate Operator verification recorded full required host/backup/SSH/HTTP/config/network/firewall PASS and unchanged failed boot/repair bytes |
| Elevated Operator | Actual launch output: SONNGUYEN\Admin, SID S-1-5-21-3276894829-3488928311-148614882-1001, elevated/Administrator/Hyper-V readable=true, Pass=true at 2026-11-03T18:03:41.1368075Z (2026-11-04 01:03:41 Asia/Saigon) |
| Learner startup | Original qualified launcher completed TerminalOnly startup after local Windows TicketSimAgent authentication; it checked Agent identity evidence, actual process owner and TLS before writing M1 evidence |
| Completion | Continue printed `Retired upgrade completed. Learner terminal-only, Operator consent page ready, M3 preserved.` It reached this only after immutable complete-stage role/process/TLS/readiness and actual M3/host checks, maintenance release and installed-stage persistence |
| Learner browser | Supplied screenshot shows 112 tickets, terminal verification mode with fault/reset locked, preflight PASS at 01:05:40, all displayed required checks PASS |
| Operator browser | Supplied screenshot shows authenticated Operator session, LAB-TLAB-002 neutral catalog entry, unavailable/unqualified explanation and disabled scope-review button |
| Independent HTTPS learner probe | Codex verified the real trusted HTTPS endpoint `https://127.0.0.1:4174/api/v1/status`: schemaVersion=1, phase=terminal_only, environmentReady=true, vmVerified=true, actionsEnabled=false, terminalEnabled=true, secureTransport=true, mockEngineAvailable=false |
| Independent HTTPS Operator probe | Codex verified trusted HTTPS `https://127.0.0.1:4176/` returns 200, without reading pairing links/cookies/tokens |

The guarded completion path establishes installed stage and maintenance release. Codex's unelevated principal did not separately read back the private SQLite/installation files. Runtime principal/process qualification is attributed to the successful guarded actual helper checks, not inferred solely from public endpoint fields. No new browser terminal password or terminal repair session was requested in this turn.

## Preserved boundaries and remaining work

- Historical M3 run `76213ef3-ef9b-4bd2-9cb6-6c508dc2a92c` and consumed first-trial permit stay preserved. No second live run is authorized.
- Original VM/checkpoint/backup identities remain the existing B5 bindings. Runtime completion stopped no process and performed no VM-changing action. The earlier explicitly approved one boot and one firewalld stop are consumed, not new reusable permissions.
- Failed boot and firewall-repair records remain unchanged, with separate verification evidence. Do not delete them, repeat legacy upgrade/resume helpers or use Stop/Refresh against the installed state.
- The firewall stop is temporary; firewalld startup/permanent policy was not changed. Do not call the repaired baseline reboot/reset-stable. M4.2 must qualify deterministic post-boot/post-reset bootstrap before another usable scenario can be released.
- Operator qualifies zero new packs. The disabled LAB-02 button is correct. Browser pairing/catalog readiness is not qualification of real per-run approvals or execution for a new pack.
- Keep 112 original tickets, saved progress, fixture-only Guided terminals, protected lab1/recovery/switches and all backups intact. All four preexisting untracked audit files remain untouched.

Next source work follows existing M4.2: protected fixed guest bundle/credential lifetime, post-boot firewall baseline handling, shared recovery integration and a concrete separately approved bootstrap qualification. LAB-02 follows that qualification; do not reopen a mock/architecture milestone or silently change B5.
