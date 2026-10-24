// Apply explicit case/path text corrections after technical case authoring.
// Keys and fixture bytes are deliberately outside this patch surface.
export function applyEditorialEdits(cases, edits) {
  let applied = 0
  for (const [ticketId, paths] of Object.entries(edits)) {
    const content = cases[ticketId]
    if (!content) throw new Error(`Unknown editorial case: ${ticketId}`)
    for (const [path, replacement] of Object.entries(paths)) {
      const segments = path.split('.')
      const permitted = segments[0] === 'customerExplanation' || segments[0] === 'hints' || segments[0] === 'verificationPrompt' || segments[0] === 'answerOverrides' && segments.length === 2 || segments[0] === 'probes' && segments.length === 3 && ['purpose', 'why', 'meaning'].includes(segments[2]) || segments[0] === 'questions' && (segments.length === 3 && ['prompt', 'explanation'].includes(segments[2]) || segments.length === 4 && segments[2] === 'options')
      if (!permitted) throw new Error(`Editorial path changes non-prose data: ${ticketId}/${path}`)
      let holder = content
      for (const segment of segments.slice(0, -1)) {
        if (holder?.[segment] === undefined) throw new Error(`Unknown editorial path: ${ticketId}/${path}`)
        holder = holder[segment]
      }
      const last = segments.at(-1)
      const before = holder?.[last]
      const stringChange = typeof before === 'string' && typeof replacement === 'string' && replacement.trim()
      const tupleChange = Array.isArray(before) && Array.isArray(replacement) && before.length === replacement.length && replacement.every(value => typeof value === 'string' && value.trim())
      if (!stringChange && !tupleChange) throw new Error(`Invalid editorial value: ${ticketId}/${path}`)
      holder[last] = structuredClone(replacement)
      applied++
    }
  }
  return applied
}
