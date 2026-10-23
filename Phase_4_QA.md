# Phase 4 QA — support level and knowledge review

## Delivered

- Beginner / Normal / Independent preference is stored as an optional v5 field. Old v5 records and migrations from v1–v4 still load. Beginner exposes command suggestions and a four-field Practice form for any level; Normal retains difficulty-based help; Independent hides command suggestions and hints while retaining typed fixture lookup and the inline Command Library. Switching levels does not reset a draft or erase previously opened hints.
- Review Mistakes groups current unresolved Guided question errors by authored `skill` across tickets. It also includes latest Objective Exam errors, latest Stateful errors and failed independent variants. A knowledge button opens a short targeted Guided quiz when possible, otherwise its related ticket/assessment. Historical error details remain visible separately.
- An authored variant may grant Mastered only on its first submitted attempt, after the 24-hour delay and with every answer correct. Repeating that same variant after seeing feedback is practice and cannot grant Mastered. A failed variant needs a new authored scenario for a later mastery assessment; currently only one variant exists for each of six cases.

## Verification

| Gate | Result |
|---|---|
| v1–v5 migration and v5 support preference round trip | Unit tests passed |
| Correct/incorrect grading, exact fixture/alias/state command matching, delayed first-try Mastered | Unit tests passed |
| `npm test -- --run` | 20/20 passed |
| `npm run build` | Passed; Vite bundle-size advisory remains |
| `npm run test:browser` | 8/8 passed at 1440px/390px Chromium, including preference persistence and knowledge-targeted review |

Independent is a reduced-support learning mode, not a secure exam; the learner can switch modes or open the Command Library. Free-form notes remain self-reviewed. New Guided cases without a reviewed alternate scenario can be Completed but cannot become Mastered. No real commands, VPS, SSH or VirtualBox are used.
