# Phase 5C — Batch 7 QA (2026-10-23)

## Scope

Added Guided `VPS-14-001`–`008`: **112/112** total, 28 cases at each L0–L3. Billing and lifecycle evidence is labeled Panel and never sent to a shell. The cases distinguish invoice state, settled payment, provisioning event, IP allocation, cancellation effective date, refund review, retention/deletion risk, duplicate charges and abuse hold. L2/L3 require two additional panel observations before interpretation and include an ordered sequence. The eight customer messages and all 112 source tickets remain unchanged.

Four Billing/Panel reference cards were added; command/task library count is **122**. No new Stateful path is created because these scenarios depend on external billing/security decisions rather than a credible before/after guest simulation.

## Verification performed

- `npm run prepare-data`: prepared 112 source and 112 Guided; schema, fixture uniqueness and answer-key validation passed.
- `npm test -- --run`: 20/20 passed, including all Guided correct/wrong objective keys, command matching, L2/L3 probe gates and v1–v5 progress.
- `npm run build`: passed (`tsc -b`, Vite); chunk-size warning remains.
- `npm run test:browser` with installed Microsoft Edge: 14/14 passed. New L3 `VPS-14-008` browser path verified appeal/policy evidence gating. Earlier paths cover desktop/mobile, keyboard, Guided feedback/command lookup, empty stdout, source overrides, v1 migration, v5 export/import and delayed Mastered.

## Limits

One browser path per new batch plus the shared smoke suite is representative QA, not a full end-to-end pass on every one of the 112 cases. Panel state is an authored snapshot and does not authorize payment, refund, service deletion or abuse override. Guided coverage is complete; Objective Exam, Stateful and independent Mastered variants remain **6/112 each** at this checkpoint.
