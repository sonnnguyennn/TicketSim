# Phase D2.1 — Command Library and English reference summaries

## Scope and evidence

Reviewed against HEAD `c2b994e`, the 112 original ticket records, the 122 current command IDs and 140 authored command/task examples. This is a content and UI review against authored fixture chains and available command documentation, not a live VPS or GreenCloud SOP validation. The [command review inventory](audit/phase-d2-1-command-review.json) records each command, input, sample output and interpretation inspected. Ticket note authoring is in [guided-reference-notes.mjs](scripts/guided-reference-notes.mjs). Source metadata currently records 71 `SOURCE_VERIFIED` command semantics, 31 `PENDING`, 20 `INTERNAL_SOP_REQUIRED` tasks and 0 `LAB_VERIFIED`; authored sample outputs are not independent source evidence.

## Learner-facing changes

- The shell card now reads as purpose → syntax and typed components → useful flags/subcommands → 1–3 examples with command, output and interpretation → short notes. Repeated quick summary, duplicated full commands in option rows, internal verification codes, ticket IDs and identical distro lines were removed from the learner view.
- Support tasks use a separate component with purpose, observation location, data, outcome meaning and authority/escalation. They show no Linux syntax, terminal or flags. The library introduction says provider screens and permissions require internal SOP confirmation.
- Syntax components distinguish flags, subcommands, positional arguments, NSS databases, targets, filters and separate commands. `getent passwd USER` shows `passwd` as a database and `USER` as a key.
- Examples label excerpt output. A blank stdout is shown as blank; interpretation cannot infer success without an exit status. The `getent` found and not-found examples display exit status 0 and 2.
- Guided after submission shows the English reference note. Questions, hints and option feedback stay Vietnamese; Legacy Exam answer fields and grading remain in their original shape.

## Technical findings and corrections

| Severity | Location | Evidence and correction | Verification boundary |
|---|---|---|---|
| Major | `src/guided/commands.ts`, `commandKnowledge.ts`: `getent-passwd` | The old card displayed an `admin:x:` entry while its interpretation said no entry. Replaced with separate `webapp` found and `admin` absent examples, explicit NSS database/key labels and exit statuses. | The [getent manual](https://man7.org/linux/man-pages/man1/getent.1.html) supports database/key behavior and exit status 2. Sample account records remain authored examples. An entry does not prove SSH authorization or a valid password. |
| Major | `src/guided/commands.ts`: `ss-ltnp` | The sample showed a TCP/22 listener while its interpretation discussed *no* listener. The unprivileged example also showed a root process PID. It now shows the listener without `users:`; the privileged example shows the PID. | Sample output illustrates guest sockets only; provider firewall and client reachability remain separate checks. |
| Major | `src/guided/commands.ts`: `ip-route` | The sample contained a default route while its interpretation described a missing one. Interpretation now describes the route present and its reachability limit. | Route lookup is not a packet reachability test. |
| Major | `src/guided/moreCommands.ts`: `ip-family-addr` | Output contained an IPv4 `inet` line while interpretation said no IPv4 line. Interpretation now reflects the observed address. | Address presence does not establish correct allocation or reachability. |
| Minor | `src/guided/commands.ts`: `find-files`, `journalctl-unit` | A one-line find excerpt was previously read as evidence of many files; the journal example used a generic stop explanation despite showing a listening event. Both now explain the actual line and evidence limit. | Neither excerpt establishes a full timeline or root cause. |
| Major | `src/guided/moreCommands.ts`: `ip-route-add`, `systemctl-restart`, `rm-rf` | Empty stdout could be read as proof that a state-changing action completed. Interpretations now require exit status and a follow-up state check. | The examples remain documentation only; no state-changing command was run. |

All 122 example chains were read from the review inventory; 20 support task structures were read in `supportKnowledge.ts`. No other direct contradiction was identified in this pass. This conclusion is limited to authored examples and does not certify command behavior on a live distro or internal provider system.

## Data preservation and validation

- `prepare-guided.mjs` appends `referenceNoteEn` to each generated Guided answer JSON from a separate authored source. It validates exact 112-ID coverage, required sections, absence of Vietnamese text and placeholders. `audit:content` verifies the generated note, six original answer fields and scoring rubric for every ticket.
- `starter-data/tickets.json`, the 112 original ticket IDs, answer keys, objective scoring, progress v5 and `GUIDED_CONTENT_REVISION = D1-2026-10-26` remain unchanged. Existing drafts and attempts are not regraded or reset for reference-note edits.
- The terminal remains fixture-only. The new examples are documentation; they cannot execute a command, SSH or provider action.
- Status text in the notes describes proposed action or pending escalation, never a completed remediation without evidence.

## Screenshots

| View | Before | After |
|---|---|---|
| `getent passwd USER` | [before](screenshots/phase-d2-1/before-getent.png) | [after](screenshots/phase-d2-1/after-getent.png) |
| `ss -ltnp` | [before](screenshots/phase-d2-1/before-ss.png) | [after](screenshots/phase-d2-1/after-ss.png) |
| `journalctl` | [before](screenshots/phase-d2-1/before-journalctl.png) | [after](screenshots/phase-d2-1/after-journalctl.png) |
| Backup `PANEL:` task | [before](screenshots/phase-d2-1/before-panel.png) | [after](screenshots/phase-d2-1/after-panel.png) |
| Submitted Guided summary | [before](screenshots/phase-d2-1/before-guided-summary.png) | [after](screenshots/phase-d2-1/after-guided-summary.png) |

Mobile 390px: [Command Library](screenshots/phase-d2-1/after-getent-390.png), [Guided summary](screenshots/phase-d2-1/after-guided-summary-390.png). Screenshots use authored fixtures and a synthetic completed Guided draft for presentation; they are not evidence of a real command run or learner completion.

## Gates

| Gate | Result |
|---|---|
| `npm run prepare-data` | Passed; 112 Guided cases regenerated |
| `npm run audit:content` | Passed; 0 errors, protected source/progress files unchanged |
| `npm test -- --run` | Passed; 37 unit tests |
| `npm run build` | Passed; TypeScript and Vite; existing large-chunk warning |
| `npm run test:browser` | Passed; 44 browser tests |

Browser coverage includes a full Guided path in all 14 topics, 390px navigation, command lookup, empty stdout, and v5 export/import. One browser-gate startup attempt failed with a transient Windows file-open error while predev generated answer JSON; after closing the screenshot dev server, the full browser suite passed. Automated checks test structural coverage and known regressions; they cannot replace expert review of every technical claim.

## Remaining SOP and lab checks

- The 20 support tasks require internal GreenCloud SOP validation of actual screen names, permissions, approval paths and escalation owners. Current descriptions are conceptual learning tasks.
- Authored sample outputs have not been reproduced on CentOS Stream 9, Ubuntu, a hypervisor or provider control plane. Command documentation supports syntax and interpretation boundaries where cited, not a guarantee that each sample line appears verbatim.
- A separate lab pass should cover distro/version differences, permissions, exit behavior and commands still tagged `PENDING` in source metadata. This phase does not claim live lab verification.

## Commits

- `171e79f` — Command Library, English notes, generated answer files, review inventory, regression tests and screenshots.
- This QA report is committed separately after the implementation commit.

## 112 authored English reference notes

Each row below links a ticket ID to its individually authored issue line and status. Full Issue, Findings, Next Action, Verification and Status prose is in the authoring source and generated Guided answer JSON.

| Ticket | Issue | Status |
|---|---|---|
| VPS-01-001 | SSH connection refused. | Pending authorized remediation and verification. |
| VPS-01-002 | SSH login rejected for the requested username. | Pending authorized remediation and verification. |
| VPS-01-003 | SSH private key rejected on the client. | Pending authorized remediation and verification. |
| VPS-01-004 | SSH traffic blocked at the guest firewall. | Pending authorized remediation and verification. |
| VPS-01-005 | SSH host key changed after a rebuild. | Pending authorized remediation and verification. |
| VPS-01-006 | Source IP listed in the SSH ban. | Pending authorized remediation and verification. |
| VPS-01-007 | SSH is listening on a nondefault port. | Pending authorized remediation and verification. |
| VPS-01-008 | SSH sessions drop while the guest is under load. | Pending investigation and verification. |
| VPS-02-001 | Guest cannot reach outside its subnet. | Pending authorized remediation and verification. |
| VPS-02-002 | Hostname lookup fails while IP traffic works. | Pending authorized remediation and verification. |
| VPS-02-003 | Guest interface has no IPv4 address. | Pending authorized remediation and verification. |
| VPS-02-004 | HTTPS listener is not exposed by the inspected firewall zone. | Pending authorized remediation and verification. |
| VPS-02-005 | Target interface has IPv6 but no IPv4. | Pending authorized remediation and verification. |
| VPS-02-006 | Packet loss on the tested path. | Network escalation recommended; unresolved. |
| VPS-02-007 | SSH reachability differs by source network. | Network escalation recommended; unresolved. |
| VPS-02-008 | Large packets fail along the tested path. | Network investigation pending. |
| VPS-03-001 | Application site unavailable because Nginx is stopped. | Pending authorized remediation and verification. |
| VPS-03-002 | Web application cannot write uploads. | Pending authorized remediation and verification. |
| VPS-03-003 | Nginx fails configuration validation. | Pending authorized remediation and verification. |
| VPS-03-004 | SELinux denied the web write operation. | Pending authorized remediation and verification. |
| VPS-03-005 | Application startup blocked by its database dependency. | Pending authorized remediation and verification. |
| VPS-03-006 | Application repeatedly exits after startup. | Pending authorized remediation and verification. |
| VPS-03-007 | Application reached an open-file limit. | Pending authorized remediation and verification. |
| VPS-03-008 | Root filesystem is read-only after an error. | Storage escalation recommended; unresolved. |
| VPS-04-001 | High CPU use during customer slowness. | Pending authorized remediation and verification. |
| VPS-04-002 | Memory pressure with active swapping. | Pending authorized remediation and verification. |
| VPS-04-003 | Application process was killed by OOM. | Pending authorized remediation and verification. |
| VPS-04-004 | Elevated disk I/O wait. | Investigation pending. |
| VPS-04-005 | Container workload may be CPU throttled. | Investigation pending. |
| VPS-04-006 | Application memory rises over time. | Application investigation pending. |
| VPS-04-007 | Guest shows high CPU steal time. | Node escalation recommended; unresolved. |
| VPS-04-008 | Intermittent slowness during backup window. | Backup coordination pending. |
| VPS-05-001 | Root filesystem has no free blocks. | Pending authorized remediation and verification. |
| VPS-05-002 | File creation blocked by inode exhaustion. | Pending authorized remediation and verification. |
| VPS-05-003 | Persistent journals occupy substantial disk space. | Pending authorized remediation and verification. |
| VPS-05-004 | Data volume remounted read-only after I/O errors. | Storage escalation recommended; unresolved. |
| VPS-05-005 | Virtual disk grew but filesystem capacity did not. | Pending authorized remediation and verification. |
| VPS-05-006 | Deleted log remains open. | Pending authorized remediation and verification. |
| VPS-05-007 | Filesystem error during boot. | Storage escalation recommended; unresolved. |
| VPS-05-008 | LVM group has capacity not yet assigned to the data filesystem. | Pending authorized remediation and verification. |
| VPS-06-001 | VPS is powered off. | Pending authorized remediation and verification. |
| VPS-06-002 | Customer asks whether a reboot will fix slowness. | Customer decision pending. |
| VPS-06-003 | Root credential is unavailable. | Authorization and recovery pending. |
| VPS-06-004 | Customer requested OS reinstall. | Customer approval pending; no reinstall performed. |
| VPS-06-005 | VM entered emergency mode on boot. | Pending authorized remediation and verification. |
| VPS-06-006 | VM repeatedly boots into rescue media. | Pending authorized remediation and verification. |
| VPS-06-007 | Panel console displays a black screen. | Panel escalation recommended; guest state unverified. |
| VPS-06-008 | VM remains in Stopping state. | Virtualization escalation recommended; unresolved. |
| VPS-07-001 | Website unavailable because Nginx is inactive. | Pending authorized remediation and verification. |
| VPS-07-002 | Site returns HTTP 403. | Pending authorized remediation and verification. |
| VPS-07-003 | Requested URL returns HTTP 404. | Pending authorized remediation and verification. |
| VPS-07-004 | Reverse proxy returns HTTP 502. | Pending authorized remediation and verification. |
| VPS-07-005 | Presented TLS certificate has expired. | Pending authorized remediation and verification. |
| VPS-07-006 | Site returns HTTP 503 after deployment. | Pending authorized remediation and verification. |
| VPS-07-007 | TLS SNI selects the wrong site certificate. | Pending authorized remediation and verification. |
| VPS-07-008 | Intermittent HTTP 504 from upstream. | Pending authorized remediation and verification. |
| VPS-08-001 | DNS A record still points to the former address. | Pending authorized remediation and verification. |
| VPS-08-002 | Lookup uses a misspelled hostname. | Pending authorized remediation and verification. |
| VPS-08-003 | Delegation still points to old nameservers. | Pending authorized remediation and verification. |
| VPS-08-004 | DNS query times out while direct HTTP works. | Pending authorized remediation and verification. |
| VPS-08-005 | Recursive DNS still returns an older A record. | Cache convergence pending. |
| VPS-08-006 | AAAA record targets unassigned IPv6. | Pending authorized remediation and verification. |
| VPS-08-007 | Reverse DNS record is absent. | Pending authorized remediation and verification. |
| VPS-08-008 | DNSSEC validation failure suspected. | DNS escalation recommended; unresolved. |
| VPS-09-001 | Repeated failed SSH logins. | Security monitoring pending. |
| VPS-09-002 | Office IP is blocked by Fail2ban. | Pending authorized remediation and verification. |
| VPS-09-003 | SELinux blocks web-to-backend connection. | Pending authorized remediation and verification. |
| VPS-09-004 | Unrecognized privileged account. | Security escalation recommended; compromise unconfirmed. |
| VPS-09-005 | Outbound SMTP abuse report. | Abuse escalation recommended; unresolved. |
| VPS-09-006 | Provider DDoS mitigation affects the service. | Network escalation recommended; unresolved. |
| VPS-09-007 | Unknown successful root SSH login. | Security escalation recommended; unresolved. |
| VPS-09-008 | Unknown root cron job and changed script hash. | Security escalation recommended; unresolved. |
| VPS-10-001 | VM is shut off at the hypervisor. | Pending authorized remediation and verification. |
| VPS-10-002 | Expected virtual NIC is missing. | Virtualization escalation recommended; unresolved. |
| VPS-10-003 | VM NIC attached to the wrong bridge. | Virtualization escalation recommended; unresolved. |
| VPS-10-004 | Host CPU contention likely. | Node escalation recommended; unresolved. |
| VPS-10-005 | Expected data disk is detached from the VM. | Storage and virtualization escalation recommended; unresolved. |
| VPS-10-006 | Data appears older after a snapshot restore. | Recovery planning pending. |
| VPS-10-007 | Network interruption overlapped live migration. | Virtualization escalation recommended; unresolved. |
| VPS-10-008 | Guest clock is significantly behind. | Pending authorized remediation and verification. |
| VPS-11-001 | Backup target quota exceeded. | Backup coverage at risk; remediation pending. |
| VPS-11-002 | Requested restore point is unavailable. | Customer decision pending; no restore performed. |
| VPS-11-003 | Backup archive fails integrity checks. | Recovery source unverified. |
| VPS-11-004 | Snapshot failed because datastore is full. | Storage escalation recommended; unresolved. |
| VPS-11-005 | Restore omitted a separate data disk. | Pending authorized remediation and verification. |
| VPS-11-006 | Restored point may miss later transactions. | Recovery point agreement pending. |
| VPS-11-007 | Backup agent authentication failed after key rotation. | Backup coverage at risk; credential update pending. |
| VPS-11-008 | Restored VM duplicates the live IPv4 address. | Pending authorized remediation and verification. |
| VPS-12-001 | Provisioning cannot allocate IPv4. | IPAM escalation recommended; unresolved. |
| VPS-12-002 | Panel state appears stale. | Panel reconciliation pending. |
| VPS-12-003 | Provisioned OS differs from the order. | Customer decision pending. |
| VPS-12-004 | Guest-visible CPU count differs from plan. | Pending authorized remediation and verification. |
| VPS-12-005 | Reinstall task waits on another job. | Operations escalation recommended; reinstall pending. |
| VPS-12-006 | Guest IPv4 differs from ordered allocation. | Pending authorized remediation and verification. |
| VPS-12-007 | API mutation denied by token scope. | Authorization pending. |
| VPS-12-008 | One order appears to have provisioned twice. | Operations escalation recommended; unresolved. |
| VPS-13-001 | API container exited. | Pending authorized remediation and verification. |
| VPS-13-002 | Container port is not published to the host. | Pending authorized remediation and verification. |
| VPS-13-003 | Published service is bound to host loopback. | Pending authorized remediation and verification. |
| VPS-13-004 | Container was OOM-killed. | Pending authorized remediation and verification. |
| VPS-13-005 | DNS lookup fails inside the container. | Pending authorized remediation and verification. |
| VPS-13-006 | Container bridge forwarding is disabled. | Pending authorized remediation and verification. |
| VPS-13-007 | Compose database dependency is unavailable. | Pending authorized remediation and verification. |
| VPS-13-008 | New container image rejects an old config option. | Pending authorized remediation and verification. |
| VPS-14-001 | Service suspended for overdue payment. | Billing action pending. |
| VPS-14-002 | Paid invoice has not advanced provisioning. | Billing/operations reconciliation pending. |
| VPS-14-003 | Customer requested end-of-term cancellation. | Customer authorization pending. |
| VPS-14-004 | Customer asks about refund eligibility. | Billing decision pending. |
| VPS-14-005 | Paid IPv4 add-on has no assigned address yet. | IPAM/operations review pending. |
| VPS-14-006 | Service data faces a retention deadline. | Urgent billing/retention escalation recommended. |
| VPS-14-007 | Invoice may contain a duplicate product line. | Billing review pending. |
| VPS-14-008 | Abuse suspension appeal awaits a decision. | Abuse/Security decision pending. |
