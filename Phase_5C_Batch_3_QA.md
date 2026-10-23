# Phase 5C — Batch 3 QA (2026-10-23)

## Scope

Added Guided content for `VPS-01-008`, `VPS-02-006`, `VPS-02-008`, `VPS-03-007`, `VPS-03-008`, `VPS-04-006`, `VPS-04-007`, `VPS-04-008`, `VPS-05-008`, `VPS-07-003`, `VPS-07-005`, `VPS-07-008`, `VPS-08-006`, `VPS-08-008`. Guided coverage is **56/112** (14 per difficulty). Each new case has customer symptom, P1/P2, two additional authored investigations except the L1 `VPS-07-003` (also has two), answer feedback, a self-reviewed note, safe decision and verification. L2/L3 interpretation requires the extra probes and includes an ordered decision sequence. The 112 source tickets and progress format v5 did not change.

`VPS-07-003` source P2 embeds “intended deploy” beside `nginx -T`, and `VPS-08-006` source P2 embeds a panel allocation beside `dig` output. Guided overrides contain only plausible command output. Separate Guided panel fixtures carry the allocation or deployment context. Original P1/P2 remain available to Practice and Legacy Exam without edits. `VPS-05-008` uses Guided-only formatted `lsblk`/`vgs` output to distinguish disk, VG, LV and filesystem.

## Verification performed

- `npm run prepare-data`: 112 original tickets and 56 Guided prepared; schema and fixture uniqueness checks passed.
- `npm test -- --run`: 20/20 passed. Checks include answer/feedback files, command fixture matching, correct/plausible wrong grading, advanced probe gating, source output preservation/Guided overrides, v1–v5 storage tests already in the suite.
- `npm run build`: passed (`tsc -b`, Vite). Vite reports a 500 kB chunk warning, not a build error.
- `npm run test:browser` with installed Microsoft Edge supplied through `PLAYWRIGHT_CHROMIUM_PATH`: 9/9 passed. Includes desktop/mobile layout, keyboard, v1 migration, v5 export/import, Mastered delay, Guided probe gating, command lookup and a mobile `VPS-07-003` path verifying the annotation does not appear as stdout. The first browser attempt without a configured browser executable did not start; the subsequent configured run passed.

## Technical review and limits

CentOS Stream 9 and Ubuntu command differences remain documented in the existing command library; new network, DNS and infrastructure tasks use the context stated in each probe. `VPS-02-006` does not locate loss from 20 ICMP probes; `VPS-02-008` treats MTU as suspected; `VPS-08-008` does not claim a specific DNSSEC chain defect. `VPS-03-008` and `VPS-04-007` escalate guest/storage or host evidence instead of instructing a guest repair. `VPS-07-005` compares the served certificate to the explicit UTC fixture date, and `VPS-05-008` requires filesystem type before a grow plan.

No new Stateful, Objective Exam or independent review variant was authored in this batch: counts remain **6/112 each**. The browser suite is a representative path test, not an end-to-end review of every new case. More case-specific technical and browser review is needed for batches 4–7 and for independent assessment expansion.
