import fs from 'node:fs'
import path from 'node:path'
import { transformWithOxc } from 'vite'

// Read the real TypeScript authoring source for audits, without a second card dataset.
export async function loadCommandLibrary(root = path.resolve(import.meta.dirname, '../..')) {
  const cache = new Map()
  async function moduleUrl(filename) {
    if (cache.has(filename)) return cache.get(filename)
    let { code } = await transformWithOxc(fs.readFileSync(filename, 'utf8'), filename)
    for (const match of [...code.matchAll(/from\s+(['"])(\.[^'"]+)\1/g)]) {
      const specifier = match[2]
      const dependency = path.resolve(path.dirname(filename), specifier.endsWith('.ts') ? specifier : `${specifier}.ts`)
      code = code.replace(match[0], `from ${JSON.stringify(await moduleUrl(dependency))}`)
    }
    const url = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
    cache.set(filename, url)
    return url
  }
  return (await import(await moduleUrl(path.join(root, 'src/guided/commands.ts')))).commandLibrary
}
