# Topic 08 editorial recovery

This review covers the wording patch in `scripts/content/phase-b-08-editorial.mjs`. It is an explicit map of dotted paths for `VPS-08-001` through `VPS-08-008`, intended for application to the existing topic records. It does not modify authored commands, output fixtures, answer keys, gate definitions, case IDs, review metadata, or the original tickets.

| Case | Editorial finding and repair |
| --- | --- |
| VPS-08-001 | Separated joined IP and DNS text in probe meanings, evidence feedback, and diagnosis; clarified the SSH distractor. |
| VPS-08-002 | Separated `ww` and `www` consistently and kept the distinction between NXDOMAIN and an untested web service. |
| VPS-08-003 | Existing learner text was readable; no replacement was needed. |
| VPS-08-004 | Rewrote customer context, hints, probe meanings, all question text and feedback, and six answer fields. Preserved DNS timeout as insufficient evidence of a missing A record. |
| VPS-08-005 | Rewrote joined wording for authoritative answers, recursive cache, TTL, all question text and feedback, and six answer fields. Preserved the need to check all authoritative servers before attributing the difference to cache. |
| VPS-08-006 | Rewrote joined wording for A/AAAA, allocation, all question text and feedback, and six answer fields. Preserved uncertainty about IPv6 reachability and the need for owner approval. |
| VPS-08-007 | Rewrote joined wording for SMTP source IP, PTR, provider ownership, all question text and feedback, and six answer fields. Preserved separate checks for forward DNS and other mail policies. |
| VPS-08-008 | Rewrote joined wording for validating queries, `+cd`, DS/DNSKEY/RRSIG, all question text and feedback, and six answer fields. Preserved uncertainty about which DNSSEC component failed. |

Follow-up audit included the output interpretation question in every case. The initial pass missed its fields because the scan excluded keys named `output`. The sidecar now repairs joined text in those questions, including the severe output questions of 08-004 through 08-008, and minor missed wording in 08-001 and 08-002.

Local validation: both source and sidecar modules import; 259 replacement paths resolve against the current topic records; every option replacement is a complete `[label, feedback]` tuple. All 259 replacements appear unchanged in the effective `allPhaseBEdits` export. A second scan of learner-visible strings across all eight cases found no remaining joined-word defects; retained unpatched strings were read individually. This is an editorial review, not a full runtime or browser QA claim. The integration owner will run project tests and build.
