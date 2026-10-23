// Phase B authoring layer. The legacy case builder supplies identity and gates;
// explicit case records supply the learning text. Never generate pedagogical prose here.
export function applyGuidedEdits(contents, edits) {
  const byId = new Map(contents.map(content => [content.id, content]))
  for (const [id, edit] of Object.entries(edits)) {
    const content = byId.get(id)
    if (!content) throw new Error(`Unknown content edit: ${id}`)
    for (const field of ['objective', 'customerExplanation', 'hints', 'verificationPrompt', 'answerOverrides']) {
      if (edit[field] !== undefined) content[field] = structuredClone(edit[field])
    }
    const questionIds = content.questions.map(question => question.id)
    if (Object.keys(edit.questions).length !== questionIds.length || Object.keys(edit.questions).some(key => !questionIds.includes(key))) throw new Error(`Incomplete question review: ${id}`)
    for (const question of content.questions) {
      const authored = edit.questions[question.id]
      if (authored.correctIds || authored.kind || authored.requiredProbeIds) throw new Error(`Grading/gate changes require compatibility review: ${id}/${question.id}`)
      const optionIds = question.options.map(option => option.id)
      if (Object.keys(authored.options).length !== optionIds.length || Object.keys(authored.options).some(key => !optionIds.includes(key))) throw new Error(`Incomplete option review: ${id}/${question.id}`)
      question.prompt = authored.prompt
      question.explanation = authored.explanation
      for (const option of question.options) {
        const tuple = authored.options[option.id]
        if (!Array.isArray(tuple) || tuple.length !== 2 || tuple.some(value => typeof value !== 'string')) throw new Error(`Invalid authored option: ${id}/${question.id}/${option.id}`)
        ;[option.label, option.feedback] = tuple
      }
    }
    const initialIds = ['P1', 'P2', ...content.extras.flatMap((probe, index) => !probe.requiredState || probe.requiredState.includes('initial') ? [`G${index + 1}`] : [])]
    if (initialIds.some(probeId => !edit.probes[probeId]) || Object.keys(edit.probes).some(probeId => !initialIds.includes(probeId))) throw new Error(`Incomplete initial probe review: ${id}`)
    for (const [probeId, patch] of Object.entries(edit.probes)) {
      if (!patch.purpose || !patch.why || !patch.meaning) throw new Error(`Missing three-part command explanation: ${id}/${probeId}`)
      const { output, command, ...notes } = patch
      if (probeId === 'P1' || probeId === 'P2') {
        const index = Number(probeId.slice(1)) - 1
        Object.assign(content.probeNotes[index], notes)
        if (output !== undefined) content.probeOverrides = { ...content.probeOverrides, [probeId]: output }
        if (command !== undefined) content.probeCommandOverrides = { ...content.probeCommandOverrides, [probeId]: command }
      } else {
        const probe = content.extras[Number(probeId.slice(1)) - 1]
        Object.assign(probe, notes)
        if (output !== undefined) probe.output = output
        if (command !== undefined) probe.command = command
      }
    }
  }
}
