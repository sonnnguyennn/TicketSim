import fs from 'node:fs'
import path from 'node:path'
import Ajv2020 from 'ajv/dist/2020.js'

const root = path.resolve(import.meta.dirname, '..')
const source = JSON.parse(fs.readFileSync(path.join(root, 'starter-data/tickets.json'), 'utf8'))
const schema = JSON.parse(fs.readFileSync(path.join(root, 'starter-data/ticket_schema.json'), 'utf8'))
const ajv = new Ajv2020({ strict: false, allErrors: true })
if (!ajv.validate(schema, source)) {
  throw new Error(`Ticket schema validation failed: ${ajv.errorsText()}`)
}
const tickets = source.tickets
const ids = new Set(tickets.map(ticket => ticket.id))
const topics = new Set(tickets.map(ticket => ticket.topic))
if (tickets.length !== 112 || ids.size !== 112 || topics.size !== 14) {
  throw new Error('Expected 112 unique tickets across 14 topics')
}
for (const topic of topics) {
  for (let level = 0; level <= 3; level++) {
    if (tickets.filter(ticket => ticket.topic === topic && ticket.difficulty === level).length !== 2) {
      throw new Error(`Expected 2 tickets for ${topic} L${level}`)
    }
  }
}
for (const ticket of tickets) {
  if (typeof ticket.hint !== 'string' || typeof ticket.production_warning !== 'string' || !ticket.scoring_rubric || ticket.probe_outputs.length !== 2 || ticket.probe_outputs.some(probe => !probe.available || probe.mutates_guest || !probe.probe_id || !probe.command || typeof probe.stdout !== 'string')) {
    throw new Error(`Incomplete or unsafe fixture: ${ticket.id}`)
  }
}
const publicTickets = tickets.map(({ title, subject, expected_diagnosis, recommended_next_checks, resolution_guidance, verification, escalate_when, hint, production_warning, scoring_rubric, ...ticket }) => {
  const answer = { expected_diagnosis, recommended_next_checks, resolution_guidance, verification, escalate_when, production_warning, scoring_rubric }
  const answerPath = path.join(root, 'public', 'answers', `${ticket.id}.json`)
  const hintPath = path.join(root, 'public', 'hints', `${ticket.id}.json`)
  fs.mkdirSync(path.dirname(answerPath), { recursive: true })
  fs.mkdirSync(path.dirname(hintPath), { recursive: true })
  fs.writeFileSync(answerPath, JSON.stringify(answer, null, 2))
  fs.writeFileSync(hintPath, JSON.stringify({ hint }, null, 2))
  return ticket
})
const outputPath = path.join(root, 'src', 'data', 'tickets-public.json')
fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify(publicTickets, null, 2))
console.log(`Prepared ${tickets.length} tickets, ${topics.size} topics, 4 levels; answer files kept separate.`)
