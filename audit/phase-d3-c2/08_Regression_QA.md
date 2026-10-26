# D3-C2 regression QA

Executed in `E:\Document\TicketSim` against the final authored content and generated data:

| Check | Result | What it covers |
|---|---|---|
| `npm run prepare-data` | PASS | 112 original tickets, 112 Guided cases, separated answers/feedback/hints generated. |
| `npm run audit:content` | PASS, 0 errors | Content structure, 620 questions, 122 cards, command/fixture mappings. The output's “rewritten” counts refer to the historical Phase B generator, not 620 new C2 edits. |
| `npm test -- --run` | PASS, 46/46 | Timeline, UTC journal windows, revised case keys, plausible wrong-option grading, tracepath PMTU, command knowledge, content lint, progress and data behavior. |
| `npm run build` | PASS | TypeScript and production Vite build. Bundle size warning for a >500 kB chunk remains. |
| `npm run test:browser` | PASS, 50/50 | Feedback at mobile width, Quick Lookup, card deduplication, 390/1440 px flows, v5 export/import, v1–v4 migration, revised draft preservation, topic paths. |
| `node scripts/export-d3-assessment.mjs` | PASS | 112 tickets, 122 cards, 620 questions, 14 topics. |
| `node scripts/export-d3-c2-review.mjs` | PASS | 620 question records, 122 card records, 112 English-note records; zero changed correctIds. |
| Independent screening join | PASS | UTF-8 BOM normalized; 620 question and 122 command input keys joined, including 224 distractor-cue question flags. Exporter rejects missing join keys. |
| Baseline ID/output comparison | PASS | 112 case IDs and every question option ID unchanged. Only Guided probe output change is `VPS-02-008/G1`; only probe command changes are the three dated journal UTC probes. |
| Source preservation | PASS | No changes under `starter-data/` or progress/store/engine modules. Original ticket fixtures remain intact. |

The browser suite covers the existing v5 persistence and migration path, including the new C2 revision restart behavior. Historical submitted attempts remain stored; an unfinished draft for a changed case asks for an explicit restart. Tests show internal consistency and app behavior, not live Ubuntu/CentOS output or expert approval.

See `04_Technical_Findings.csv` for the technical finding on the Guided-only tracepath fixture and its remaining lab condition. The reviewer ledgers distinguish agent review from SME approval.
