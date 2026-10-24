# Guided authoring

`../guided-content.mjs` builds the stable case identities, question kinds, keys, gates and hidden assessment definitions. Phase B modules in this directory provide explicit learning text; they are the effective authoring source, imported by that entry point. No learner-facing prose is composed by `apply-guided-edits.mjs`.

Each case supplies customerExplanation, objective, three progressive hints, all existing questions and option feedback, verificationPrompt, six Guided answerOverrides, and purpose/why/meaning for every initial probe. IDs, correct keys and gates are deliberately rejected as patch fields. A deliberate semantic/key migration needs its own compatibility work.

For source probe output corrections use `probes.P1.output` or `probes.P2.output`; the helper records them in Guided-only overrides. `command` can fix an invalid canonical command without editing source112. Never preserve invalid syntax as an alias merely to return a successful result. Existing saved command/output records remain untouched. Log every changed output or command in `review.fixtureChanges` and explain the primary reference or fictional-panel consistency check.

Final Guided answers are emitted separately under `public/guided-answers`; Practice/Legacy answers and scoring rubrics keep the source data. Stateful changed/escalated probes and assessment definitions are not patched by this layer.

Run `npm run prepare-data`, `npm run audit:content`, unit tests, build and browser tests after editing. The audit compares against the Phase A baseline, reports per-ticket notes and exact duplicate groups, and checks all112 cases,122 cards, keys, reachable probes, aliases and protected source/progress files. Its checks support case-by-case review; they do not establish technical truth on their own.
