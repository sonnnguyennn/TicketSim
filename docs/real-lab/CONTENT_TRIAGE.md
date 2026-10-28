# Content triage for Ubuntu Real Lab

**Evidence base:** working tree on 2026-10-29; `scripts/guided-content.mjs`, `src/guided/commands.ts`, `starter-data/tickets.json`, `TicketSim_112_Ticket_Lab_Triage.csv`, `TicketSim_122_Command_Audit.csv`, `TicketSim_Question_Review_Watchlist.csv`, and `TicketSim_Architecture_Content_Audit_2026-10-28.md`. The four audit files were already untracked user files and are not modified here. Automated baseline audit confirms 112 tickets, 112 Guided cases, 620 scored questions and 122 command cards. Existing ledger reports 393 Guided probes; no Ubuntu lab execution has verified them.

## Classification

| Class | Evidence | Decision |
|---|---|---|
| Confirmed environment incompatibility | Ticket triage CSV records 104 cases as CentOS Stream 9 and 8 as N/A; none are authored for Ubuntu 22.04. `src/guided/commands.ts:40-42` explicitly distinguishes `sshd` unit on CentOS from `ssh` on Ubuntu; `:49` and `:62` describe NetworkManager/firewalld workflows. | Do not reuse commands, service names, interface names or setup steps verbatim. Build Ubuntu-specific manifests and verify output on the selected image. This is a lab-portability issue, not a bug in Guided. |
| Environment-specific limitation | Triage CSV identifies 40 provider-workflow-only cases and 15 hybrid cases requiring panel/hypervisor evidence. `scripts/guided-content.mjs` includes panel/hypervisor probes, e.g. the VPS-02-001 flow near line 100 and VPS-03-001 flow near line 126. | A single guest VM cannot supply real provider billing, control panel or edge-network evidence. Keep these in Guided or author controlled external mocks with separate provenance. |
| Suspected issue needing validation | 31 command cards are `PENDING`, all 122 are `LAB_PENDING`, and 20 support tasks require internal SOP per command audit CSV. The question watchlist flags answer-pattern and distractor concerns; those are screening flags, not correctness failures. | Review against the target Ubuntu image, commands and independent SME guidance before enabling a lab. |
| Missing information | No verified VM ownership, baseline, backup, lab user, management network, host resource budget, live fixture outputs or approved grading checks. | Phase 1 blocked until host/operator evidence exists. |
| Already fixed in Guided | Existing audit and QA documents record case-specific fixture/editorial corrections; `npm run audit:content` currently reports zero errors. | Preserve Guided source and answer keys. No bulk edit to 112 tickets in Phase 0. |

## Candidate selection

The user-provided triage CSV classifies 33 cases as `P0_CANDIDATE_ON_UBUNTU`, 15 hybrid redesign, 12 needing guest dependencies, 12 multi-system mock/container cases and 40 provider-only cases. These are *triage labels*, not ready-to-run lab manifests. The lowest-complexity seeds to investigate first are `VPS-01-001` (SSH service) and `VPS-03-001` (web service). `VPS-01-001` currently uses `systemctl status sshd` and a simulated start action (`scripts/guided-content.mjs:17-31`), so the Ubuntu unit, service package, setup, fault verifier and external SSH grading must be authored separately. `VPS-03-001` needs independent HTTP checks, not just `systemctl active`. Network routes, firewall, disk pressure and provider workflows have higher recovery or data-loss risk and are deferred.

No confirmed scored-answer error was found by this Phase 0 review. Screened question flags and audit notes should not be presented as verified bugs. No source ticket, answer key or Guided fixture was changed.
