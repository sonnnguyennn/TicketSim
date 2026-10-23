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

B2 review of the remaining 35 cases will be added after the B1 integration checkpoint.
