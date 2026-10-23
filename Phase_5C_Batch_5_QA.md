# Phase 5C — Batch 5 QA (2026-10-23)

## Scope

Added Guided `VPS-09-001`–`008` and `VPS-13-001`–`008`: **88/112** total, 22 cases at each L0–L3. Security cases require source/timestamp/owner and escalation before changes to Fail2ban, SELinux, root credentials, firewall, processes or abuse mitigation. Container cases distinguish app state, port exposure, memory limits, DNS scope, host forwarding and deployment rollback. L2/L3 cases have two additional authored probes and an ordered sequence.

Guided-only overrides replace terse/editorial source output in SSH, Docker, `ss`, `sha256sum`, `top` and `getent` cases. The 112 source tickets stay unchanged. `VPS-13-002` (`docker port web`) and `VPS-13-005` (`docker exec api getent hosts example.com`) now have genuinely empty stdout fixtures; additional probes establish meaning without fabricating output. The Guided schema was adjusted to allow an empty override. Nine reference cards were added, bringing the command library to **111**.

## Verification performed

- `npm run prepare-data`: 112 source tickets and 88 Guided prepared; schema, alias and answer key validation passed.
- `npm test -- --run`: 20/20 passed. Includes all authored case path scoring, plausible wrong choices, exact fixture lookup, advanced probe gates, v1–v5 progress and source preservation.
- `npm run build`: passed (`tsc -b`, Vite). Chunk-size warning remains.
- `npm run test:browser` with installed Microsoft Edge: 12/12 passed. New paths check L3 `VPS-09-007` evidence gating, an empty Docker stdout fixture, and unsupported command handling. Existing paths cover desktop/mobile, keyboard, migration, v5 export/import and delayed Mastered. An initial browser test had a locator mismatch; it was corrected and the full suite passed.

## Limits

Abuse/security evidence is a snapshot and does not authorize containment or attribute an actor. A blank command output by itself is ambiguous, so the affected cases require additional observations. No Stateful, Objective Exam or independent variant was added in this batch: **6/112 each**. Representative browser paths do not constitute end-to-end manual review of all 16 new tickets.
