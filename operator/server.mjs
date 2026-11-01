import http from 'node:http'
import { randomUUID, timingSafeEqual } from 'node:crypto'
import { readFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { DatabaseSync } from 'node:sqlite'
import { assertLiveApproval } from '../agent/livePolicy.mjs'

const exec = promisify(execFile)
const HOST = '127.0.0.1', PORT = 4175
const script = new URL('../scripts/real-lab/Invoke-LabHost.ps1', import.meta.url).pathname.replace(/^\/(\w:)/, '$1')
const equal = (a, b) => typeof a === 'string' && typeof b === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b))
function send(res, status, body) { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify(body)) }
async function bodyJson(req) {
  if (req.headers['content-type'] !== 'application/json') throw new Error('JSON_REQUIRED')
  const chunks = []; let bytes = 0
  for await (const chunk of req) { bytes += chunk.length; if (bytes > 1024) throw new Error('BODY_TOO_LARGE'); chunks.push(chunk) }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

export class OperatorJournal {
  constructor(filename) {
    mkdirSync(dirname(filename), { recursive: true })
    this.db = new DatabaseSync(filename)
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
      CREATE TABLE IF NOT EXISTS approvals (approval_id TEXT PRIMARY KEY, run_id TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS actions (action_id TEXT PRIMARY KEY, approval_id TEXT NOT NULL, run_id TEXT NOT NULL, operation_id TEXT NOT NULL, status TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT, error_code TEXT);`)
  }
  close() { this.db.close() }
  claim(approvalId, runId) {
    this.db.exec('BEGIN IMMEDIATE')
    try {
      const existing = this.db.prepare('SELECT run_id FROM approvals WHERE approval_id=?').get(approvalId)
      if (existing) throw new Error('APPROVAL_ALREADY_USED')
      this.db.prepare('INSERT INTO approvals VALUES (?,?)').run(approvalId,runId)
      this.db.exec('COMMIT')
    } catch (error) { this.db.exec('ROLLBACK'); throw error }
  }
  reserve(approvalId, runId, operationId) {
    this.db.exec('BEGIN IMMEDIATE')
    try {
      const existing = this.db.prepare('SELECT run_id FROM approvals WHERE approval_id=?').get(approvalId)
      if (!existing || existing.run_id !== runId) throw new Error('APPROVAL_NOT_CLAIMED_FOR_RUN')
      const prior = this.db.prepare('SELECT status FROM actions WHERE approval_id=? AND run_id=? AND operation_id=?').get(approvalId,runId,operationId)
      if (prior) throw new Error('OPERATION_ALREADY_ATTEMPTED')
      const actionId = randomUUID()
      this.db.prepare('INSERT INTO actions VALUES (?,?,?,?,?,?,?,?)').run(actionId,approvalId,runId,operationId,'started',new Date().toISOString(),null,null)
      this.db.exec('COMMIT'); return actionId
    } catch (error) { this.db.exec('ROLLBACK'); throw error }
  }
  finish(actionId, status, errorCode = null) { this.db.prepare('UPDATE actions SET status=?, finished_at=?, error_code=? WHERE action_id=? AND status=?').run(status,new Date().toISOString(),errorCode,actionId,'started') }
}

export async function runHostAction(operationId, checkpointId) {
  const action = operationId === 'real-host-inspect-v1' || operationId === 'real-host-claim-v1' ? 'inspect' : operationId === 'real-host-reset-v1' ? 'reset' : null
  if (!action) throw new Error('UNKNOWN_OPERATION')
  const { stdout } = await exec('pwsh', ['-NoProfile','-NonInteractive','-File',script,'-Action',action,'-CheckpointId',checkpointId], { timeout: action === 'reset' ? 220_000 : 50_000, windowsHide: true, maxBuffer: 8192 })
  return JSON.parse(stdout)
}

export function createOperatorServer({ approval, token, journal, runner = runHostAction } = {}) {
  assertLiveApproval(approval)
  if (typeof token !== 'string' || token.length < 32 || !journal) throw new Error('OPERATOR_CONFIG_INVALID')
  return http.createServer(async (req,res) => {
    if (req.socket.remoteAddress !== HOST || req.headers.host !== `${HOST}:${req.socket.localPort}` || req.headers.origin || req.method !== 'POST' || req.url !== '/v1/action' || !equal(req.headers.authorization, `Bearer ${token}`)) { send(res,403,{error:'FORBIDDEN'}); return }
    try {
      const body = await bodyJson(req)
      if (!body || Object.keys(body).sort().join(',') !== 'approvalId,operationId,runId' || body.approvalId !== approval.approvalId || !['real-host-inspect-v1','real-host-claim-v1','real-host-reset-v1'].includes(body.operationId) || body.operationId !== 'real-host-inspect-v1' && !/^[0-9a-f-]{36}$/i.test(body.runId ?? '') || body.operationId === 'real-host-inspect-v1' && body.runId !== null) throw new Error('INVALID_ACTION')
      let actionId = null
      if (body.operationId === 'real-host-claim-v1') journal.claim(approval.approvalId,body.runId)
      if (body.operationId === 'real-host-reset-v1') actionId = journal.reserve(approval.approvalId,body.runId,body.operationId)
      try {
        const observation = await runner(body.operationId,approval.checkpointId)
        if (observation?.targetVmId?.toLowerCase() !== approval.vmId.toLowerCase() || observation?.checkpointId?.toLowerCase() !== approval.checkpointId.toLowerCase()) throw new Error('HOST_IDENTITY_MISMATCH')
        if (actionId) journal.finish(actionId,'pass')
        send(res,200,{operationId:body.operationId,approvalId:approval.approvalId,outcome:'pass',observation})
      } catch (error) { if (actionId) journal.finish(actionId,'failed','OPERATOR_ACTION_FAILED'); throw error }
    } catch { send(res,409,{error:'OPERATOR_ACTION_BLOCKED'}) }
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const approvalPath = process.env.TICKETSIM_LIVE_APPROVAL
  const token = process.env.TICKETSIM_OPERATOR_TOKEN
  const statePath = process.env.TICKETSIM_OPERATOR_DB
  if (!approvalPath || !token || !statePath) throw new Error('OPERATOR_CONFIG_REQUIRED')
  const approval = assertLiveApproval(JSON.parse(readFileSync(approvalPath,'utf8')))
  const journal = new OperatorJournal(statePath)
  createOperatorServer({ approval, token, journal }).listen(PORT,HOST,() => process.stdout.write(`TicketSim operator boundary listening on ${HOST}:${PORT}\n`))
}
