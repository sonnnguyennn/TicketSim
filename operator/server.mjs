import http from 'node:http'
import { randomUUID, timingSafeEqual } from 'node:crypto'
import { readFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { DatabaseSync } from 'node:sqlite'
import { assertLiveApproval } from '../agent/livePolicy.mjs'

const exec = promisify(execFile)
const HOST = '127.0.0.1', PORT = 4175
const script = fileURLToPath(new URL('../scripts/real-lab/Invoke-LabHost.ps1', import.meta.url))
const equal = (a, b) => typeof a === 'string' && typeof b === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b))
function send(res, status, body) { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify(body)) }
const knownFailures=['READ_ONLY_OPERATOR','INVALID_ACTION','APPROVAL_ALREADY_USED','APPROVAL_NOT_CLAIMED_FOR_RUN','APPROVAL_START_WINDOW_EXPIRED','OPERATION_ALREADY_ATTEMPTED','RESET_NOT_VERIFIED','HOST_IDENTITY_MISMATCH','B5_OPERATOR_LEASE_UNRESOLVED','VM_IDENTITY_MISMATCH','CHECKPOINT_ID_MISMATCH','CHECKPOINT_TYPE_MISMATCH','TARGET_DISK_MISMATCH','DISK_CHAIN_INVALID','DISK_CHAIN_BASE_MISMATCH','BACKUP_MISSING','BACKUP_HASH_MISMATCH','MANAGEMENT_BINDING_MISMATCH','RESOURCE_UNKNOWN','RESET_STATE_INVALID','RESOURCE_MINIMUM_FAILED','CLEAN_SHUTDOWN_TIMEOUT','CHECKPOINT_CHANGED','RESET_NOT_OFF','INSUFFICIENT_RAM_TO_BOOT','RESET_POSTCHECK_FAILED','PROTECTED_STATE_CHANGED']
function failureCode(error){return knownFailures.find(code=>error?.message===code||String(error?.stderr??'').includes(code))??'HOST_ACTION_FAILED'}
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
    if(!this.db.prepare('PRAGMA table_info(approvals)').all().some(column=>column.name==='finalized_at'))this.db.exec('ALTER TABLE approvals ADD COLUMN finalized_at TEXT')
  }
  close() { this.db.close() }
  claim(approvalId, runId) {
    this.db.exec('BEGIN IMMEDIATE')
    try {
      const existing = this.db.prepare('SELECT run_id FROM approvals WHERE approval_id=?').get(approvalId)
      if (existing) throw new Error('APPROVAL_ALREADY_USED')
      this.db.prepare('INSERT INTO approvals (approval_id,run_id) VALUES (?,?)').run(approvalId,runId)
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
  finalize(approvalId,runId) {
    const claimed=this.db.prepare('SELECT * FROM approvals WHERE approval_id=? AND run_id=?').get(approvalId,runId)
    const reset=this.db.prepare("SELECT status FROM actions WHERE approval_id=? AND run_id=? AND operation_id='real-host-reset-v1'").get(approvalId,runId)
    if(!claimed||reset?.status!=='pass')throw new Error('RESET_NOT_VERIFIED')
    this.db.prepare('UPDATE approvals SET finalized_at=COALESCE(finalized_at,?) WHERE approval_id=? AND run_id=?').run(new Date().toISOString(),approvalId,runId)
  }
}

export async function runHostAction(operationId, checkpointId) {
  const action = ['real-host-inspect-v1','real-host-claim-v1','real-host-finalize-v1'].includes(operationId) ? 'inspect' : operationId === 'real-host-reset-v1' ? 'reset' : null
  if (!action) throw new Error('UNKNOWN_OPERATION')
  const { stdout } = await exec(process.env.TICKETSIM_PWSH || 'pwsh', ['-NoProfile','-NonInteractive','-File',script,'-Action',action,'-CheckpointId',checkpointId], { timeout: action === 'reset' ? 220_000 : 50_000, windowsHide: true, maxBuffer: 8192 })
  return JSON.parse(stdout)
}

export function createOperatorServer({ approval, token, journal, runner = runHostAction, readOnly = false } = {}) {
  assertLiveApproval(approval, {readOnly})
  if (typeof token !== 'string' || token.length < 32 || !journal) throw new Error('OPERATOR_CONFIG_INVALID')
  return http.createServer(async (req,res) => {
    if (req.socket.remoteAddress !== HOST || req.headers.host !== `${HOST}:${req.socket.localPort}` || req.headers.origin || req.method !== 'POST' || req.url !== '/v1/action' || !equal(req.headers.authorization, `Bearer ${token}`)) { send(res,403,{error:'FORBIDDEN'}); return }
    try {
      const body = await bodyJson(req)
      if (readOnly && body?.operationId !== 'real-host-inspect-v1') throw new Error('READ_ONLY_OPERATOR')
      if (!body || Object.keys(body).sort().join(',') !== 'approvalId,operationId,runId' || body.approvalId !== approval.approvalId || !['real-host-inspect-v1','real-host-claim-v1','real-host-reset-v1','real-host-finalize-v1'].includes(body.operationId) || body.operationId !== 'real-host-inspect-v1' && !/^[0-9a-f-]{36}$/i.test(body.runId ?? '') || body.operationId === 'real-host-inspect-v1' && body.runId !== null) throw new Error('INVALID_ACTION')
      let actionId = null
      if (body.operationId === 'real-host-claim-v1') {
        if(approval.trialStartBefore&&(!Number.isFinite(Date.parse(approval.trialStartBefore))||Date.now()>=Date.parse(approval.trialStartBefore)))throw new Error('APPROVAL_START_WINDOW_EXPIRED')
        journal.claim(approval.approvalId,body.runId)
      }
      if (body.operationId === 'real-host-reset-v1') actionId = journal.reserve(approval.approvalId,body.runId,body.operationId)
      try {
        const observation = await runner(body.operationId,approval.checkpointId)
        if (observation?.targetVmId?.toLowerCase() !== approval.vmId.toLowerCase() || observation?.checkpointId?.toLowerCase() !== approval.checkpointId.toLowerCase()) throw new Error('HOST_IDENTITY_MISMATCH')
        if (actionId) journal.finish(actionId,'pass')
        if (body.operationId==='real-host-finalize-v1')journal.finalize(approval.approvalId,body.runId)
        send(res,200,{operationId:body.operationId,approvalId:approval.approvalId,outcome:'pass',observation})
      } catch (error) { if (actionId) journal.finish(actionId,'failed',failureCode(error)); throw error }
    } catch(error) { send(res,409,{error:'OPERATOR_ACTION_BLOCKED',code:failureCode(error)}) }
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const approvalPath = process.env.TICKETSIM_LIVE_APPROVAL
  const token = process.env.TICKETSIM_OPERATOR_TOKEN
  const statePath = process.env.TICKETSIM_OPERATOR_DB
  if (!approvalPath || !token || !statePath) throw new Error('OPERATOR_CONFIG_REQUIRED')
  const readOnly = process.env.TICKETSIM_TERMINAL_ONLY === '1'
  const approval = assertLiveApproval(JSON.parse(readFileSync(approvalPath,'utf8')), {readOnly})
  const journal = new OperatorJournal(statePath)
  createOperatorServer({ approval, token, journal, readOnly }).listen(PORT,HOST,() => process.stdout.write(`TicketSim operator boundary listening on ${HOST}:${PORT} (${readOnly?'inspect only':'approved trial'})\n`))
}
