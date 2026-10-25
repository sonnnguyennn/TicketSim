# Phase D remediation backlog — proposed, not implemented

This list is grouped by severity and distinguishes technical correctness from learning quality. No runtime content, answer key, fixture or progress schema was changed in Phase C. Apply fixes in `scripts/guided-content.mjs` or the relevant `scripts/content/` authoring source, then regenerate data with `npm run prepare-data` and test in Phase D.

## Critical

No Critical issue was supported by the reviewed evidence. Keep destructive production changes gated by owner authorization and applicable internal SOP.

## Major — technical correctness

1. **PC-011/012/013, relative journal time:** Pin the incident date in `VPS-04-008`, `VPS-09-007` and `VPS-01-008` probes and matching check options, or make the fixture date relative to a simulated clock explicitly shown to the learner. Recheck every `--since`/`--until` probe after editing.
2. **PC-016/017, ambiguous check keys:** In `VPS-02-006`, ask specifically for loss *by hop* if MTR alone is intended; endpoint loss alone also makes `ping` valid. In `VPS-10-006`, make the question ask for the activity log specifically or stop treating snapshot metadata's `restore completed` field as wrong. Reread all option feedback after either change.
3. **PC-010/014, unsupported answers:** Remove the implied simultaneity from `VPS-01-008` until the OOM event and memory sample are timestamped in the same window. For `VPS-08-008`, correct the triage key/wording: P1/P2 query the same resolver with and without `+cd`; G1 asks another resolver. Keep the answer bounded to what each probe shows.

## Minor — technical realism and linkage

1. **PC-001/009/018, fixture shape:** Restore the missing peer-address column in the two post-action `ss -ltnp` rows and provide a credible full `top` excerpt for `VPS-10-004`, or label it explicitly as a selected excerpt. Compare revised outputs with real command formats in an isolated CentOS Stream 9 and Ubuntu lab when available.
2. **PC-002/003, card mapping:** Link `VPS-01-001/G5` (`ssh -o BatchMode=yes`) to a card that teaches BatchMode instead of `ssh-vvv`. Keep terminal matching restricted to authored JSON fixture commands.
3. **PC-008, DNSSEC evidence:** Expand the `VPS-08-008` `+cd` fixture to include the relevant response sections and validation flags, while retaining the current cautious conclusion. Validate expected DNS behavior in an isolated lab.
4. **Provider authority:** Obtain internal SOP for the 23 tickets labelled `INTERNAL_SOP_REQUIRED` before teaching exact staff permissions or GreenCloud-specific escalation as fact. Public terms only establish broad unmanaged support scope.

## Minor — learning quality

1. **PC-006/007:** Replace implausible distractors in `VPS-10-001` and `VPS-13-001` with nearby but wrong choices that exercise access role, evidence and image dependency reasoning.
2. Add a human-reviewed customer reply and internal handoff exercise. The 112 final notes are self-reviewed; they do not assess whether a learner can communicate uncertainty, impact, owner and next update under an unscripted incident.
3. Add a small blind lab or mixed-case assessment for symptom triage, command choice and interpretation without the fixed-choice cues. Treat scores as supervised formative signals until that gate exists.
4. Add Windows VPS/RDP and product-specific support-boundary cases, because the current training is Linux focused while the public catalog also includes Windows VPS. Keep advanced host, storage and DNSSEC actions focused on recognition and escalation for L1.

## Editorial

1. Fix `PC-004/005/015/019` at their cited authoring lines, then perform a Vietnamese copy edit across questions, wrong-answer feedback, hints and verification prompts. Avoid mechanical global replacements of technical terms.

## Phase D acceptance checks

For each remediation, record the new source location, changed generated output, effect on answer keys, fixture-only terminal behavior, `npm run audit:content`, `npm test -- --run` and `npm run build`. A passing build does not replace a technical SME, source or lab review. Preserve the 112 original tickets and existing user progress.
