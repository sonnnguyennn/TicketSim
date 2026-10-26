import { createServer } from 'vite'
import fs from 'node:fs'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { commandLibrary } = await server.ssrLoadModule('/src/guided/commands.ts')
  const rows = commandLibrary.map(card => ({
    id: card.id, command: card.command, kind: card.knowledge.kind, safety: card.safety,
    verification: card.knowledge.verification, sourceUrls: card.knowledge.sourceUrls,
    options: card.knowledge.options.map(({ name, kind, purpose }) => ({ name, kind, purpose })),
    examples: card.knowledge.examples.map(({ command, expectedOutput, interpretation, outputIsExcerpt, exitStatus }) => ({ command, expectedOutput, interpretation, outputIsExcerpt, ...(exitStatus === undefined ? {} : { exitStatus }) })),
  }))
  fs.writeFileSync('audit/phase-d2-1-command-review.json', JSON.stringify(rows, null, 2))
  console.log(`Exported ${rows.length} cards, ${rows.reduce((sum, row) => sum + row.examples.length, 0)} examples`)
} finally {
  await server.close()
}
