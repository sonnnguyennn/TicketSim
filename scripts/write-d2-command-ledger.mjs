import fs from 'node:fs'
import path from 'node:path'
import { loadCommandLibrary } from './content/load-command-library.mjs'

const root = path.resolve(import.meta.dirname, '..')
const cards = await loadCommandLibrary(root)
const priorReview = JSON.parse(fs.readFileSync(path.join(root, 'scripts/content/phase-b-command-review.json'), 'utf8'))
const priorById = new Map(priorReview.map(item => [item.id, item]))
const files = ['src/guided/commands.ts', 'src/guided/moreCommands.ts', 'src/guided/commandKnowledge.ts', 'src/guided/supportKnowledge.ts']
const lines = Object.fromEntries(files.map(file => [file, fs.readFileSync(path.join(root, file), 'utf8').split(/\r?\n/)]))
const locate = (id, filesToSearch) => {
  for (const file of filesToSearch) {
    const index = lines[file].findIndex(line => line.includes(`'${id}'`))
    if (index >= 0) return `${file}:${index + 1}`
  }
  return 'PENDING_LOCATION'
}
const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`
const columns = ['id', 'family', 'kind', 'content_review', 'verification', 'lab_verification', 'structured_options', 'usage_examples', 'card_source', 'knowledge_source', 'official_sources', 'review_note', 'remaining']
const rows = cards.map(card => {
  const prior = priorById.get(card.id)
  if (!prior?.inspected || !card.knowledge) throw new Error(`Missing prior review or D2 knowledge: ${card.id}`)
  const knowledge = card.knowledge
  return {
    id: card.id,
    family: card.family,
    kind: knowledge.kind,
    content_review: 'REASONED_REVIEW',
    verification: knowledge.verification,
    lab_verification: 'PENDING',
    structured_options: knowledge.options.length,
    usage_examples: knowledge.examples.length,
    card_source: locate(card.id, files.slice(0, 2)),
    knowledge_source: knowledge.kind === 'support_task' ? locate(card.id, [files[3]]) : (locate(card.id, [files[2]]) === 'PENDING_LOCATION' ? `src/guided/commandKnowledge.ts:${lines[files[2]].findIndex(line => line.includes('export function shellKnowledge')) + 1}` : locate(card.id, [files[2]])),
    official_sources: knowledge.sourceUrls.join('; '),
    review_note: prior.finding,
    remaining: knowledge.verification === 'INTERNAL_SOP_REQUIRED' ? 'Internal owner must validate authority and provider workflow.' : knowledge.verification === 'PENDING' ? 'Independent syntax/output and isolated lab verification pending.' : 'Isolated lab output verification pending.',
  }
})
if (rows.length !== 122 || new Set(rows.map(row => row.id)).size !== 122 || rows.some(row => row.card_source === 'PENDING_LOCATION' || row.knowledge_source === 'PENDING_LOCATION')) throw new Error('D2 ledger coverage failure')
const csv = [columns.join(','), ...rows.map(row => columns.map(column => quote(row[column])).join(','))].join('\n') + '\n'
fs.writeFileSync(path.join(root, 'Phase_D2_Command_Review_Ledger.csv'), csv)
console.log(JSON.stringify({ cards: rows.length, shell: rows.filter(row => row.kind === 'shell').length, tasks: rows.filter(row => row.kind === 'support_task').length, options: rows.reduce((sum, row) => sum + row.structured_options, 0), examples: rows.reduce((sum, row) => sum + row.usage_examples, 0), verification: Object.fromEntries([...new Set(rows.map(row => row.verification))].map(level => [level, rows.filter(row => row.verification === level).length])) }, null, 2))
