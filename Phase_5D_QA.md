# Phase 5D — Objective Exam expansion (2026-10-23)

## Scope

Added Objective Exam to 14 evidence-rich cases: `VPS-01-008`, `VPS-02-006`, `VPS-03-007`, `VPS-04-007`, `VPS-05-008`, `VPS-06-007`, `VPS-07-005`, `VPS-08-008`, `VPS-09-007`, `VPS-10-005`, `VPS-11-006`, `VPS-12-007`, `VPS-13-005`, `VPS-14-008`. Total **20/112 Objective Exam**. These cases cover each topic with one new candidate and use all initial Guided probes, including deeper L2/L3 fixtures, before showing interpretation/decision questions. The original six Stateful pilots keep their P1/P2 Objective Exam gate. Stateful remains **6/112**.

Each exam grades six authored choices: symptom, command, output, evidence, decision and a new case-specific verification/escalation question. Answer feedback is separated until submission. The new verification prompts distinguish restored service from partial progress or escalation. Objective mistakes retain topic/concept tags. Free text and Legacy Exam remain self-reviewed. Objective scores do not grant Mastered; v5 progress shape is unchanged.

## Verification performed

- `npm run prepare-data`: 112 source and Guided cases, 20 Objective Exam feedback sets prepared; schema validation passed.
- `npm test -- --run`: 21/21 passed. New tests cover every expanded exam, required extra probes, full score, plausible wrong decision/error category and existing v1–v5 migration.
- `npm run build`: passed (`tsc -b`, Vite). Chunk-size warning remains.
- `npm run test:browser` with Microsoft Edge: 15/15 passed. New path completed `VPS-14-008` Objective Exam with all panel evidence, saw 6/6, and confirmed its attempt is separate from Legacy Exam and review. Existing paths cover Guided, no-stdout, v5 import/export and Mastered delay.

## Limits

The first five objective choices share authored Guided question content; the sixth verification choice is newly authored. This measures unassisted selection after fixture review, but repeat exposure from Guided can aid recall. No scoring is claimed for prose. Only one of 14 expanded exam paths was exercised in a browser; all 14 were graded at engine level. Independent review variants are still **6/112** at this checkpoint.
