# Phase 5C — Batch 6 QA (2026-10-23)

## Scope

Added Guided `VPS-11-001`–`008` and `VPS-12-001`–`008`: **104/112** total, 26 cases at each L0–L3. Backup cases distinguish job state, artifact integrity, restore test and RPO. Control-panel cases compare order/task state with guest and host observations. Reinstall, restore, IP changes and duplicate VM cleanup remain proposals with owner approval and rollback. L2/L3 have two additional probes and gated interpretation.

`VPS-11-003` replaces editorial checksum text with a literal Guided hash and a separate expected-hash panel fixture. `VPS-12-006` replaces a terse source address line with a plausible `ip -4 addr` line. Original 112 tickets remain untouched. Seven panel/backup/guest command cards were added; library count is **118**.

## Verification performed

- `npm run prepare-data`: prepared 112 source tickets and 104 Guided; schema, fixture and answer-key checks passed.
- `npm test -- --run`: 20/20 passed, including source preservation, Guided overrides, grading, command lookup, advanced probe gating and v1–v5 progress tests.
- `npm run build`: passed (`tsc -b`, Vite). Chunk-size warning remains.
- `npm run test:browser` with Microsoft Edge: 13/13 passed. New L3 `VPS-11-008` browser path checked that duplicate IP evidence from panel is required before interpretation. Existing paths check mobile/desktop, keyboard, v5 export/import, v1 migration, delayed Mastered and empty stdout.

## Limits

A panel restore point is a catalog entry; no recovery is claimed until checksum, restore test and application data are verified. `VPS-11-006` computes a 60-hour time gap, not a proven count of lost orders. No new Stateful, Objective Exam or independent review variant was added: **6/112 each**. The browser suite exercises representative paths; it does not visit every new case end to end.
