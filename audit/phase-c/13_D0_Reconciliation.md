# Phase D0 — audit reconciliation

Baseline at start: `e1ab5c37cf2d70a69be3d5ec9a53ff01fe09e2b9` on `master`; working tree clean.

| Check | Result |
|---|---|
| Ticket ledger | 112/112 semantic, 0 pending |
| Effective command cards | 122/122 semantic, 0 pending |
| Scored questions | 620/620 semantic, 0 pending |
| Documented Guided fixture overrides | 101/101 semantic, 0 pending |
| Finding register | PC-001 through PC-019 present, unique, all OPEN; each has source, severity, evidence and remediation |
| Root-cause groups | 8 |
| Internal SOP ticket flags | 23 |

`git show --name-only e1ab5c3` lists only `audit/phase-c/` files. `git diff e1ab5c3^ e1ab5c3` for runtime sources, `src/data/` and `public/` was empty. Three protected source SHA-256 values still match `audit/phase-c/12_Verification_Record.md`:

- `scripts/guided-content.mjs`: `9A719B66DAECE5AC96BE6EAF15E0E8FA55851FB5708E3059349C091B4969585D`
- `starter-data/tickets.json`: `706EF607B984D69846E4C59B670A80B5488E618080B812D9B38CEA9BC4BC09F7`
- `src/guided/commands.ts`: `38C5FC789223664BC574AECEC978B6BAD23F6373B71BF6A3B0F3B07C7A17BF1B`

The Phase C2 record is internally consistent. No finding was added, closed or renumbered in D0. Semantic review remains distinct from source/lab/SOP verification.
