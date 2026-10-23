# Phase 3 — Guided coverage plan to 112

Baseline after Phase 2: **42/112 Guided**, **70 remaining**; all 112 retain Practice and Legacy Exam. This is an authoring plan, not a claim that the remaining content is implemented.

| Batch | Topic and exact remaining IDs | New | Cumulative |
|---|---|---:|---:|
| 3 — Finish priority topics | SSH: 01-008; Network: 02-006, 02-008; Linux System & Services: 03-007, 03-008; Performance: 04-006, 04-007, 04-008; Disk: 05-008; Web: 07-003, 07-005, 07-008; DNS: 08-006, 08-008 (all IDs prefixed `VPS-`) | 14 | 56/112 |
| 4 — VPS and virtualization | VPS-06-001…008, VPS-10-001…008 | 16 | 72/112 |
| 5 — Security and containers | VPS-09-001…008, VPS-13-001…008 | 16 | 88/112 |
| 6 — Backup and control panel | VPS-11-001…008, VPS-12-001…008 | 16 | 104/112 |
| 7 — Billing and lifecycle | VPS-14-001…008 | 8 | 112/112 |

All IDs in the remaining set appear once in the table above. Batch 3 is L2/L3 heavy and needs the deepest content review. `VPS-07-003` and `VPS-08-006` have source outputs with explanatory/panel annotations embedded in command output. Preserve original P1/P2 for Practice/history; before Guided conversion, author a clearly separated Guided-only corrected observation or teach explicitly which text is an annotation, with a test preventing the annotation from masquerading as command stdout.

## Acceptance checklist for every batch

- [ ] Case list matches the assigned IDs; total ticket count stays 112 and previous progress schemas v1–v5 still load.
- [ ] For each case, record symptom, OS, execution context (client/guest/panel/hypervisor), exact command syntax, literal output, meaning and limits of evidence. Do not use the diagnosis field as the sole source for objective answers.
- [ ] Distinguish observed output, working hypothesis and supported conclusion. No root cause in the initial customer/learning objective; feedback explains every correct and incorrect option.
- [ ] Include recognition, command choice, output interpretation, multiple select, safe decision, verification/escalation and a self-reviewed short note. Use ordered steps when sequence matters.
- [ ] L2/L3 require additional investigation depth: extra authored output, competing hypotheses or a branch/authorization decision. Do not relabel an L0 pattern as L3.
- [ ] For mutating actions, specify approval, scope, rollback and post-action verification; only add Stateful when before/after fixtures can support it. Escalation is a valid outcome.
- [ ] Validate JSON schema, unique command/alias/state fixtures and Command Library references with `npm run prepare-data`. Unmatched commands remain unsupported and never execute.
- [ ] Run objective grading tests for correct and plausible wrong responses, command matching/state tests, `npm test -- --run` and `npm run build`; run a browser path for at least one difficult case and check mobile overflow/keyboard access.
- [ ] Review all new output against OS and service semantics; document any source fixture limitations and resolution. Keep generated JSON out of direct edits.
- [ ] Update README, ROADMAP and batch QA with IDs, Guided completed/remaining, State/Objective/variant counts and test/build results, then commit the batch.

## Sequencing notes

- Batch 4 needs clear separation between guest, provider panel and hypervisor; host-level actions should be escalation for L1 without host authority.
- Batch 5 needs least-privilege and incident handling: do not turn security or abuse signals into automatic unban, disable-SELinux or destructive container actions.
- Batch 6 needs backup integrity and restore proof; a backup listed in panel is not yet a successful restore. Control-panel task state can lag guest/host state.
- Batch 7 needs billing and authorization boundaries. Payment or cancellation state should remain panel fixtures, not shell commands or technical root causes.
- Independent review variants should be authored as separate scenarios for each newly completed skill cluster before extending Mastered beyond the current six cases. Objective Exam expands only after independent evidence and verification keys are reviewed.
