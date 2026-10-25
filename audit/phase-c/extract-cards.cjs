// Read-only extraction of the effective cards after Phase B revisions.
const Module = require('node:module')
const path = require('node:path')
const { build } = require('rolldown')
;(async () => {
  const result = await build({ input: path.resolve(__dirname, '../../src/guided/commands.ts'), write: false, output: { format: 'cjs' } })
  const compiled = new Module(path.resolve(__dirname, 'cards-in-memory.cjs'))
  compiled.filename = path.resolve(__dirname, 'cards-in-memory.cjs')
  compiled.paths = Module._nodeModulePaths(__dirname)
  compiled._compile(result.output.find(chunk => chunk.type === 'chunk').code, compiled.filename)
  const ids = process.argv.slice(2)
  for (const card of compiled.exports.commandLibrary) {
    if (ids.length && !ids.includes(card.id)) continue
    process.stdout.write(JSON.stringify(card) + '\n')
  }
})().catch(error => { console.error(error); process.exitCode = 1 })
