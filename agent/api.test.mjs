import { afterEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import net from 'node:net'
import { PairingManager } from './auth.mjs'
import { createAgentServer } from './server.mjs'
import { LabStore } from './store.mjs'
import { MockLabService } from './service.mjs'

const origin = 'http://127.0.0.1:5177'
let server; let store; let base
afterEach(async () => {
  if (server) { await new Promise(resolve => server.close(resolve)); server = undefined }
  if (store) { store.close(); store = undefined }
})
async function setup(now = () => Date.now()) {
  store = new LabStore(':memory:')
  const service = new MockLabService(store)
  const auth = new PairingManager({ pairingCode: 'test-pairing-code-123456789', now })
  server = createAgentServer({ service, auth })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${server.address().port}`
  return { service, auth }
}
function request(path, { method = 'GET', body, token, requestKey, requestOrigin = origin } = {}) {
  const headers = {}
  if (requestOrigin) headers.Origin = requestOrigin
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  if (requestKey) headers['Idempotency-Key'] = requestKey
  return fetch(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
}
async function pair() {
  const response = await request('/api/v1/pair', { method: 'POST', body: { code: 'test-pairing-code-123456789' } })
  expect(response.status).toBe(200)
  return (await response.json()).token
}

describe('local agent pairing and API boundary', () => {
  it('keeps real readiness false and exposes only a mock catalog', async () => {
    await setup()
    expect(await (await request('/api/v1/status')).json()).toMatchObject({ environmentReady: false, vmVerified: false, actionsEnabled: false, mockEngineAvailable: true })
    const catalog = await (await request('/api/v1/scenarios')).json()
    expect(catalog.scenarios).toEqual([{ id: 'LAB-WEB-001', title: 'Nginx service unavailable', revision: 1, mode: 'mock-only', availableForRealVm: false }])
  })

  it('requires a fresh one-time pairing code and expires the bearer session', async () => {
    let time = 0; await setup(() => time)
    expect((await request('/api/v1/pair', { method: 'POST', body: { code: 'wrong' } })).status).toBe(401)
    const token = await pair()
    expect((await request('/api/v1/pair', { method: 'POST', body: { code: 'test-pairing-code-123456789' } })).status).toBe(401)
    expect((await request('/api/v1/mock-runs', { token })).status).toBe(200)
    time += 16 * 60_000
    expect((await request('/api/v1/mock-runs', { token })).status).toBe(401)
  })

  it('expires an unused pairing code', async () => {
    let time = 0; await setup(() => time)
    time = 6 * 60_000
    expect((await request('/api/v1/pair', { method: 'POST', body: { code: 'test-pairing-code-123456789' } })).status).toBe(401)
  })

  it('rejects foreign origins, missing origin on writes, and unauthorized requests', async () => {
    await setup()
    expect((await request('/api/v1/mock-runs')).status).toBe(401)
    const token = await pair()
    expect((await request('/api/v1/mock-runs', { method: 'POST', body: { scenarioId: 'LAB-WEB-001' }, token, requestKey: 'request_key_0001', requestOrigin: 'https://evil.example' })).status).toBe(403)
    expect((await request('/api/v1/mock-runs', { method: 'POST', body: { scenarioId: 'LAB-WEB-001' }, token, requestKey: 'request_key_0001', requestOrigin: null })).status).toBe(403)
    expect(store.listRuns()).toHaveLength(0)
  })

  it('validates method, body, scenario, action boundary and idempotency key', async () => {
    await setup(); const token = await pair()
    expect((await request('/api/v1/execute', { method: 'POST', body: { command: 'whoami' }, token })).status).toBe(404)
    expect((await request('/api/v1/mock-runs', { method: 'PUT', body: { scenarioId: 'LAB-WEB-001' }, token })).status).toBe(404)
    expect((await request('/api/v1/mock-runs', { method: 'POST', body: { scenarioId: 'LAB-WEB-001', script: 'any text' }, token, requestKey: 'request_key_0002' })).status).toBe(400)
    expect((await request('/api/v1/mock-runs', { method: 'POST', body: { scenarioId: 'LAB-WEB-001' }, token, requestKey: 'short' })).status).toBe(400)
    expect((await request('/api/v1/mock-runs', { method: 'POST', body: { scenarioId: 'LAB-UNKNOWN' }, token, requestKey: 'request_key_0003' })).status).toBe(404)
    expect(store.listRuns()).toHaveLength(0)
  })

  it('persists a clearly simulated API run and deduplicates requests', async () => {
    await setup(); const token = await pair()
    const start = await request('/api/v1/mock-runs', { method: 'POST', body: { scenarioId: 'LAB-WEB-001' }, token, requestKey: 'request_key_0004' })
    expect(start.status).toBe(201)
    const created = await start.json()
    expect(created).toMatchObject({ simulated: true, run: { phase: 'running', vm_ref: 'mock:web:001' } })
    const duplicate = await (await request('/api/v1/mock-runs', { method: 'POST', body: { scenarioId: 'LAB-WEB-001' }, token, requestKey: 'request_key_0004' })).json()
    expect(duplicate.run.run_id).toBe(created.run.run_id)
    const submitted = await (await request(`/api/v1/mock-runs/${created.run.run_id}/submit`, { method: 'POST', body: {}, token, requestKey: 'request_key_0005' })).json()
    expect(submitted).toMatchObject({ simulated: true, run: { phase: 'completed', recovery_status: 'verified', grade_status: 'fail' } })
    const again = await (await request(`/api/v1/mock-runs/${created.run.run_id}/submit`, { method: 'POST', body: {}, token, requestKey: 'request_key_0005' })).json()
    expect(again.run.event_sequence).toBe(submitted.run.event_sequence)
    const detail = await (await request(`/api/v1/mock-runs/${created.run.run_id}`, { token })).json()
    expect(detail.events.length).toBeGreaterThan(5)
    expect(detail.events.every(event => event.metadata.simulated)).toBe(true)
  })

  it('has no production VM or arbitrary subprocess implementation in the agent', () => {
    const files = ['server.mjs', 'service.mjs', 'registry.mjs', 'mockActions.mjs', 'mockVmController.mjs', 'store.mjs', 'auth.mjs']
    for (const file of files) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8')
      expect(source).not.toMatch(/(?:from|require\()\s*['"](?:node:)?child_process/)
      expect(source).not.toMatch(/\b(?:execFile|execSync|spawn|spawnSync|eval)\s*\(/)
    }
  })

  it('rejects WebSocket upgrade rather than creating an unauthenticated channel', async () => {
    await setup()
    const bytes = await new Promise((resolve, reject) => {
      const socket = net.createConnection(server.address().port, '127.0.0.1')
      let data = ''
      socket.setTimeout(1500, () => socket.destroy())
      socket.on('connect', () => socket.write(`GET /api/v1/mock-runs HTTP/1.1\r\nHost: 127.0.0.1:${server.address().port}\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n`))
      socket.on('data', chunk => { data += chunk.toString('utf8') })
      socket.on('close', () => resolve(data))
      socket.on('error', reject)
    })
    expect(bytes).not.toContain('101 Switching Protocols')
  })
})
