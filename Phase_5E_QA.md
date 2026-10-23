# Phase 5E — Independent review expansion (2026-10-23)

## Scope

Added fourteen authored review variants for `VPS-01-008`, `VPS-02-006`, `VPS-03-007`, `VPS-04-007`, `VPS-05-008`, `VPS-06-007`, `VPS-07-005`, `VPS-08-008`, `VPS-09-007`, `VPS-10-005`, `VPS-11-006`, `VPS-12-007`, `VPS-13-005`, `VPS-14-008`. Each uses a changed situation, at least two new evidence snapshots and three newly worded decisions with option feedback. Examples reverse the original diagnosis: hop loss without destination loss, an attached host disk missing in the guest, and an approved security appeal not yet applied in billing. Review questions carry the topic/concept skill tag into the weak-knowledge queue.

Current coverage: **112/112 Guided**, **20/112 Objective Exam**, **6/112 Stateful**, **20/112 independent Mastered variants**. Original source tickets and v5 progress format were not edited. The terminal remains fixture-only.

## Mastered rule

An Objective Exam score never grants Mastered. A Guided completion becomes eligible for its separate scenario after 24 hours; all variant answers must be correct on the first attempt. An incorrect first attempt followed by a perfect repeat does not award Mastered. Cases without an authored variant remain Completed. Feedback and answer keys are kept separate from public review prompts until submission.

## Verification performed

- `npm run prepare-data`: passed, generating 112 Guided cases and separate review feedback files; schema and fixture validation passed.
- `npm test -- --run`: **22/22** passed. The new test checks fourteen new variant scenarios, evidence, different question text, complete feedback, grading, topic/concept tracking, delay and first-attempt Mastered behavior. Existing tests cover v1–v5 progress migration and source fixtures.
- `npm run test:browser` with Microsoft Edge: **16/16** passed. A new browser path completed the delayed `VPS-12-007` variant, received 3/3, reloaded and showed Mastered. Other browser paths cover representative Guided, Objective, unsupported command, empty stdout, review, desktop/mobile and progress import/export.
- `npm run build`: passed (`tsc -b`, Vite). Vite still reports one chunk over 500 kB.
- Reviewed new evidence/decisions for CentOS Stream 9 and Ubuntu syntax, real-looking command output, limited conclusions, safe changes and escalation. Corrected `free -h`, `mtr`, `openssl`, SSH log and `dig` samples before final validation.

## Limits

The fourteen new variants are authored fixtures, not live systems. Only one new variant was completed end to end in a browser; all fourteen were checked by schema and unit tests, not manually played through one by one. **92/112** cases still have no independent variant and cannot become Mastered. **92/112** have no Objective Exam; **106/112** have no Stateful simulator. Existing Practice/Legacy Exam still uses some terse original fixture output and remains self-reviewed. A full technical/editorial review of every one of the 112 Guided paths in a browser remains open; these test results do not claim that coverage.
