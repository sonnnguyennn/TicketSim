import http from 'node:http'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { PairingManager } from './auth.mjs'
import { LabError } from './errors.mjs'
import { LabStore } from './store.mjs'
import { MockLabService } from './service.mjs'
import { LiveLabService } from './liveService.mjs'
import { LiveOperations } from './liveOperations.mjs'
import { OperatorBridge } from './operatorBridge.mjs'
import { assertLiveApproval } from './livePolicy.mjs'
import { assertNonAdmin } from './privilege.mjs'
import { readFileSync } from 'node:fs'

const HOST = '127.0.0.1'
const PORT = 4174
const allowedOrigins = new Set(['http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:5177', 'http://localhost:5177', 'http://127.0.0.1:4173', 'http://localhost:4173'])

function send(response, status, body) { response.writeHead(status).end(JSON.stringify(body)) }
function exactObject(value, keys) { return value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).every(key => keys.includes(key)) && keys.every(key => Object.hasOwn(value, key)) }
async function readJson(request) {
  if (request.headers['content-type'] !== 'application/json') throw new LabError('JSON_REQUIRED', 415)
  let size = 0; const chunks = []
  for await (const chunk of request) {
    size += chunk.length
    if (size > 4096) throw new LabError('BODY_TOO_LARGE', 413)
    chunks.push(chunk)
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { throw new LabError('INVALID_JSON', 400) }
}

export function createAgentServer({ service = null, serviceRef = null, liveService = null, liveServiceRef = null, auth = new PairingManager() } = {}) {
  const server = http.createServer(async (request, response) => {
    const activeService = serviceRef ? serviceRef.current : service
    const activeLiveService = liveServiceRef ? liveServiceRef.current : liveService
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('Referrer-Policy', 'no-referrer')
    response.setHeader('Content-Security-Policy', "default-src 'none'")
    const origin = request.headers.origin
    if (request.headers.host !== `${HOST}:${request.socket.localPort}` || origin && !allowedOrigins.has(origin) || request.socket.remoteAddress !== HOST) {
      send(response, 403, { error: 'FORBIDDEN' }); return
    }
    if (origin) response.setHeader('Access-Control-Allow-Origin', origin)
    response.setHeader('Vary', 'Origin')
    if (request.method === 'OPTIONS') {
      if (!origin || !allowedOrigins.has(origin)) { send(response, 403, { error: 'FORBIDDEN' }); return }
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key')
      response.writeHead(204).end(); return
    }
    try {
      if (typeof request.url !== 'string' || !request.url.startsWith('/') || request.url.startsWith('//')) throw new LabError('INVALID_REQUEST_TARGET', 400)
      const url = new URL(request.url, `http://${HOST}:${PORT}`)
      if (url.search || url.hash) throw new LabError('NOT_FOUND', 404)
      if (request.method === 'GET' && url.pathname === '/api/v1/status') {
        send(response, 200, { schemaVersion: 1, phase: activeLiveService ? 'live_approval_configured' : 'foundation_only', environmentReady: false, vmVerified: false, actionsEnabled: !!activeLiveService, mockEngineAvailable: !!activeService }); return
      }
      if (request.method === 'GET' && url.pathname === '/api/v1/scenarios') {
        send(response, 200, { scenarios: [...activeService?.registry.list() ?? [], ...activeLiveService?.registry.list() ?? []] }); return
      }
      if (request.method === 'POST' && url.pathname === '/api/v1/pair') {
        if (!origin) throw new LabError('ORIGIN_REQUIRED', 403)
        const body = await readJson(request)
        if (!exactObject(body, ['code']) || typeof body.code !== 'string') throw new LabError('INVALID_BODY', 400)
        send(response, 200, auth.pair(body.code)); return
      }
      if (url.pathname === '/api/v1/mock-runs' && request.method === 'GET') {
        auth.authorize(request.headers.authorization)
        if (!activeService) throw new LabError('MOCK_ENGINE_UNAVAILABLE', 503)
        send(response, 200, { simulated: true, runs: activeService.store.listRuns() }); return
      }
      if (url.pathname === '/api/v1/live-runs' && request.method === 'GET') {
        auth.authorize(request.headers.authorization)
        if (!activeLiveService) throw new LabError('LIVE_ENGINE_UNAVAILABLE', 503)
        send(response, 200, { simulated: false, runs: activeLiveService.store.listRuns().filter(run => run.mode === 'real') }); return
      }
      if (url.pathname === '/api/v1/live-runs' && request.method === 'POST') {
        if (!origin) throw new LabError('ORIGIN_REQUIRED', 403)
        auth.authorize(request.headers.authorization)
        if (!activeLiveService) throw new LabError('LIVE_ENGINE_UNAVAILABLE', 503)
        const body = await readJson(request)
        if (!exactObject(body, ['scenarioId']) || body.scenarioId !== 'LAB-WEB-001') throw new LabError('INVALID_BODY', 400)
        const run = await activeLiveService.start(body.scenarioId, request.headers['idempotency-key'])
        send(response, 201, { simulated: false, run }); return
      }
      const liveSubmitMatch = /^\/api\/v1\/live-runs\/([0-9a-f-]{36})\/submit$/.exec(url.pathname)
      if (liveSubmitMatch && request.method === 'POST') {
        if (!origin) throw new LabError('ORIGIN_REQUIRED', 403)
        auth.authorize(request.headers.authorization)
        if (!activeLiveService) throw new LabError('LIVE_ENGINE_UNAVAILABLE', 503)
        const body = await readJson(request)
        if (!exactObject(body, ['verificationNote']) || typeof body.verificationNote !== 'string' || body.verificationNote.length > 1000) throw new LabError('INVALID_BODY', 400)
        const run = await activeLiveService.submit(liveSubmitMatch[1], request.headers['idempotency-key'], body.verificationNote)
        send(response, 200, { simulated: false, run }); return
      }
      const liveRunMatch = /^\/api\/v1\/live-runs\/([0-9a-f-]{36})$/.exec(url.pathname)
      if (liveRunMatch && request.method === 'GET') {
        auth.authorize(request.headers.authorization)
        if (!activeLiveService) throw new LabError('LIVE_ENGINE_UNAVAILABLE', 503)
        const run = activeLiveService.store.getRun(liveRunMatch[1])
        if (!run || run.mode !== 'real') throw new LabError('UNKNOWN_RUN', 404)
        send(response, 200, { simulated: false, run, events: activeLiveService.store.getEvents(liveRunMatch[1]) }); return
      }
      if (url.pathname === '/api/v1/mock-runs' && request.method === 'POST') {
        if (!origin) throw new LabError('ORIGIN_REQUIRED', 403)
        auth.authorize(request.headers.authorization)
        if (!activeService) throw new LabError('MOCK_ENGINE_UNAVAILABLE', 503)
        const body = await readJson(request)
        if (!exactObject(body, ['scenarioId']) || typeof body.scenarioId !== 'string') throw new LabError('INVALID_BODY', 400)
        const run = await activeService.start(body.scenarioId, request.headers['idempotency-key'])
        send(response, 201, { simulated: true, run }); return
      }
      const submitMatch = /^\/api\/v1\/mock-runs\/([0-9a-f-]{36})\/submit$/.exec(url.pathname)
      if (submitMatch && request.method === 'POST') {
        if (!origin) throw new LabError('ORIGIN_REQUIRED', 403)
        auth.authorize(request.headers.authorization)
        if (!activeService) throw new LabError('MOCK_ENGINE_UNAVAILABLE', 503)
        const body = await readJson(request)
        if (!exactObject(body, [])) throw new LabError('INVALID_BODY', 400)
        const run = await activeService.submit(submitMatch[1], request.headers['idempotency-key'])
        send(response, 200, { simulated: true, run }); return
      }
      const runMatch = /^\/api\/v1\/mock-runs\/([0-9a-f-]{36})$/.exec(url.pathname)
      if (runMatch && request.method === 'GET') {
        auth.authorize(request.headers.authorization)
        if (!activeService) throw new LabError('MOCK_ENGINE_UNAVAILABLE', 503)
        const run = activeService.store.getRun(runMatch[1])
        if (!run) throw new LabError('UNKNOWN_RUN', 404)
        send(response, 200, { simulated: true, run, events: activeService.store.getEvents(runMatch[1]) }); return
      }
      throw new LabError('NOT_FOUND', 404)
    } catch (error) {
      if (response.headersSent) return
      send(response, error instanceof LabError ? error.status : 500, { error: error instanceof LabError ? error.code : 'INTERNAL_ERROR' })
    }
  })
  server.on('upgrade', (_request, socket) => socket.destroy())
  return server
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  assertNonAdmin()
  const auth = new PairingManager()
  const serviceRef = { current: null }
  const liveServiceRef = { current: null }
  const server = createAgentServer({ serviceRef, liveServiceRef, auth })
  const watchdog = setInterval(() => { liveServiceRef.current?.expireOverdue().catch(() => { /* Lease remains blocked on interruption. */ }) }, 30_000)
  watchdog.unref()
  server.on('close', () => clearInterval(watchdog))
  server.listen(PORT, HOST, () => {
    try {
      const store = new LabStore()
      store.markInterruptedOnStartup()
      serviceRef.current = new MockLabService(store)
      if (process.env.TICKETSIM_LIVE_APPROVAL && process.env.TICKETSIM_OPERATOR_TOKEN && process.env.TICKETSIM_AGENT_SSH_KEY && process.env.TICKETSIM_AGENT_KNOWN_HOSTS) {
        const approval = assertLiveApproval(JSON.parse(readFileSync(process.env.TICKETSIM_LIVE_APPROVAL, 'utf8')))
        const operations = new LiveOperations({ hostBridge: new OperatorBridge({ token: process.env.TICKETSIM_OPERATOR_TOKEN }), sshKeyPath: process.env.TICKETSIM_AGENT_SSH_KEY, knownHostsPath: process.env.TICKETSIM_AGENT_KNOWN_HOSTS })
        liveServiceRef.current = new LiveLabService(store, operations, approval)
      }
      process.stdout.write(`Real Lab mock agent listening on http://${HOST}:${PORT}\nPairing code (valid 5 minutes): ${auth.pairingCode}\n`)
    } catch (error) {
      process.stderr.write(`Real Lab agent failed to initialize: ${error instanceof Error ? error.message : 'unknown error'}\n`)
      server.close()
      process.exitCode = 1
    }
  })
}
