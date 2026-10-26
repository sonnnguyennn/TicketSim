// A score recorded before these D1 prompt/fixture corrections is historical.
// Keep its saved outcome; do not reinterpret it using the current question text.
export const GUIDED_CONTENT_REVISION = 'D1-2026-10-26'

export const revisedGuidedTicketIds = new Set([
  'VPS-01-001', 'VPS-01-008', 'VPS-02-006', 'VPS-03-001', 'VPS-04-008',
  'VPS-05-006', 'VPS-08-008', 'VPS-09-007', 'VPS-10-001', 'VPS-10-004',
  'VPS-10-006', 'VPS-12-007', 'VPS-13-001', 'VPS-13-008', 'VPS-14-004',
])

// Only drafts for cases with changed evidence or grading context need restarting.
// A spacing-only editorial correction does not change a learner's saved work.
export const c2RevisedGuidedTicketIds = new Set([
  'VPS-01-008', 'VPS-02-008', 'VPS-04-006', 'VPS-04-008', 'VPS-09-007', 'VPS-14-006',
])

export const guidedContentRevisionFor = (ticketId: string) =>
  c2RevisedGuidedTicketIds.has(ticketId) ? 'D3-C2-2026-10-26' : GUIDED_CONTENT_REVISION

export const hasRevisedGuidedContent = (ticketId: string) =>
  revisedGuidedTicketIds.has(ticketId) || c2RevisedGuidedTicketIds.has(ticketId)
