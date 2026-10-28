import http from 'node:http'

const HOST = '127.0.0.1'
const PORT = 4174
const allowedOrigins = new Set(['http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:5177', 'http://localhost:5177', 'http://127.0.0.1:4173', 'http://localhost:4173'])

export function createAgentServer() {
  return http.createServer((request, response) => {
    const origin = request.headers.origin
    const authority = request.headers.host
    if (authority !== `${HOST}:${PORT}` || origin && !allowedOrigins.has(origin)) {
      response.writeHead(403, { 'Cache-Control': 'no-store' }).end()
      return
    }
    if (origin) response.setHeader('Access-Control-Allow-Origin', origin)
    response.setHeader('Vary', 'Origin')
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    if (request.method !== 'GET' || request.url !== '/api/v1/status') {
      response.writeHead(404).end(JSON.stringify({ error: 'Not found' }))
      return
    }
    response.writeHead(200).end(JSON.stringify({ schemaVersion: 1, phase: 'foundation_only', environmentReady: false, vmVerified: false, actionsEnabled: false }))
  })
}

if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replaceAll('\\', '/')}`).href) {
  createAgentServer().listen(PORT, HOST, () => process.stdout.write(`Real Lab Phase 0 agent listening on http://${HOST}:${PORT}\n`))
}
