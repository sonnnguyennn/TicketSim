import { describe, expect, it } from 'vitest'
import { parseReferenceNote } from './ReferenceNote'

describe('Guided reference note presentation', () => {
  it('parses five labeled fields without splitting colons inside values', () => {
    const note = 'Issue: Service down.\nFindings: HTTP 502 at 10:14 UTC.\nNext Action: Check https://example.test:443 before an approved change.\nVerification: Retry from the affected client.\nStatus: Pending verification.'
    expect(parseReferenceNote(note)).toEqual([
      { label: 'Issue', value: 'Service down.' },
      { label: 'Findings', value: 'HTTP 502 at 10:14 UTC.' },
      { label: 'Next Action', value: 'Check https://example.test:443 before an approved change.' },
      { label: 'Verification', value: 'Retry from the affected client.' },
      { label: 'Status', value: 'Pending verification.' },
    ])
  })

  it('rejects duplicate or missing labels for the structured view', () => {
    expect(parseReferenceNote('Issue: A\nIssue: B\nNext Action: C\nVerification: D\nStatus: E')).toBeNull()
    expect(parseReferenceNote('Issue: A\nFindings: B\nNext Action: C\nVerification: D')).toBeNull()
  })
})
