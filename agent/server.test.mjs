import { afterEach, describe, expect, it } from 'vitest'
import { createAgentServer } from './server.mjs'

let server
afterEach(async () => { if (server) { await new Promise(resolve => server.close(resolve)); server = undefined } })

async function request(path, options = {}) {
  server = createAgentServer()
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  return fetch(`http://127.0.0.1:${address.port}${path}`, { ...options, headers: { Host: '127.0.0.1:4174', ...options.headers } })
}

describe('Phase 0 local agent boundary', () => {
  it('serves only a read-only, unavailable status', async () => {
    const response = await request('/api/v1/status', { headers: { Origin: 'http://localhost:5173' } })
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ phase: 'foundation_only', environmentReady: false, actionsEnabled: false })
  })

  it('rejects writes, arbitrary paths, and foreign origins', async () => {
    expect((await request('/api/v1/execute', { method: 'POST' })).status).toBe(404)
  })
  it('rejects a foreign origin', async () => {
    expect((await request('/api/v1/status', { headers: { Origin: 'https://attacker.example' } })).status).toBe(403)
  })
  it('rejects a foreign host header', async () => {
    expect((await request('/api/v1/status', { headers: { Host: 'example.com' } })).status).toBe(403)
  })
})
