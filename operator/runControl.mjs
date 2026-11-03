import { DatabaseSync } from 'node:sqlite'
import { randomUUID } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import { LIVE_TARGET } from '../agent/livePolicy.mjs'
import { getPackBlueprint } from '../agent/scenarioPacks.mjs'

const checkpointId='e6d04330-142c-4397-8e0d-ddf5a9e69090'
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
const requireCheck=(condition,code)=>{if(!condition)throw new Error(code)}

export function validateRunScope(scope){
  requireCheck(scope&&Object.keys(scope).sort().join(',')==='actions,bundleSha256,checkpointId,revision,runId,scenarioId,vmId','INVALID_RUN_SCOPE')
  const pack=getPackBlueprint(scope.scenarioId)
  requireCheck(uuid(scope.runId)&&scope.vmId===LIVE_TARGET.vmId&&scope.checkpointId===checkpointId&&
    scope.revision===pack.revision&&typeof scope.bundleSha256==='string'&&/^[a-f0-9]{64}$/.test(scope.bundleSha256)&&
    isDeepStrictEqual(scope.actions,pack.actions),'RUN_SCOPE_BINDING_MISMATCH')
  return structuredClone(scope)
}

/** Internal Operator store. It does not authenticate HTTP clients or execute
 * actions. All new admission/maintenance writers must use this same database.
 * Legacy pilot writers must be quiesced before this gate can govern deployment.
 * This constructor is never called on the installed database by current startup.
 */
export class RunControlJournal {
  constructor(filename,{now=()=>Date.now()}={}){
    this.now=now
    this.db=new DatabaseSync(filename)
    this.db.exec(`PRAGMA busy_timeout=3000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
      CREATE TABLE IF NOT EXISTS control_grants (
        approval_id TEXT PRIMARY KEY,run_id TEXT NOT NULL UNIQUE,scope_json TEXT NOT NULL,
        principal TEXT NOT NULL,issued_ms INTEGER NOT NULL,expires_ms INTEGER NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('issued','claimed','completed')));
      CREATE TABLE IF NOT EXISTS control_gate (
        vm_id TEXT PRIMARY KEY,kind TEXT NOT NULL CHECK(kind IN ('run','maintenance')),owner_id TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS control_attempts (
        attempt_id TEXT PRIMARY KEY,approval_id TEXT NOT NULL,step TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('started','pass','fail','unknown')),
        UNIQUE(approval_id,step));
      CREATE TABLE IF NOT EXISTS control_events (
        sequence INTEGER PRIMARY KEY AUTOINCREMENT,kind TEXT NOT NULL,
        reference_id TEXT NOT NULL,occurred_ms INTEGER NOT NULL,detail_json TEXT NOT NULL);`)
  }
  close(){this.db.close()}
  #tx(work){
    this.db.exec('BEGIN IMMEDIATE')
    try{const result=work();this.db.exec('COMMIT');return result}
    catch(error){this.db.exec('ROLLBACK');throw error}
  }
  #clock(){const now=this.now();requireCheck(Number.isSafeInteger(now)&&now>=0,'INVALID_CONTROL_CLOCK');return now}
  #event(kind,reference,detail={}){this.db.prepare('INSERT INTO control_events (kind,reference_id,occurred_ms,detail_json) VALUES (?,?,?,?)').run(kind,reference,this.#clock(),JSON.stringify(detail))}
  get(approvalId){
    const row=this.db.prepare('SELECT * FROM control_grants WHERE approval_id=?').get(approvalId)
    return row?{...row,scope:JSON.parse(row.scope_json),scope_json:undefined}:null
  }
  issue(scope,{principal,ttlMs=15*60_000}={}){
    const fixed=validateRunScope(scope)
    requireCheck(typeof principal==='string'&&/^[^\\\r\n]{1,80}\\[^\\\r\n]{1,80}$/.test(principal)&&!/\\TicketSimAgent$/i.test(principal),'OPERATOR_PRINCIPAL_REQUIRED')
    requireCheck(Number.isInteger(ttlMs)&&ttlMs>0&&ttlMs<=60*60_000,'INVALID_APPROVAL_TTL')
    return this.#tx(()=>{
      requireCheck(!this.db.prepare('SELECT 1 FROM control_gate WHERE vm_id=?').get(fixed.vmId),'CONTROL_GATE_HELD')
      const approvalId=randomUUID(),now=this.#clock()
      requireCheck(!this.db.prepare('SELECT 1 FROM control_grants WHERE run_id=?').get(fixed.runId),'RUN_ALREADY_APPROVED')
      if(this.db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='approvals'").get())
        requireCheck(!this.db.prepare('SELECT 1 FROM approvals WHERE run_id=?').get(fixed.runId),'LEGACY_RUN_ALREADY_APPROVED')
      this.db.prepare('INSERT INTO control_grants VALUES (?,?,?,?,?,?,?)').run(approvalId,fixed.runId,JSON.stringify(fixed),principal,now,now+ttlMs,'issued')
      this.#event('approval_issued',approvalId,{principal})
      return this.get(approvalId)
    })
  }
  claim(approvalId,scope){
    const fixed=validateRunScope(scope)
    return this.#tx(()=>{
      const grant=this.get(approvalId)
      requireCheck(grant&&isDeepStrictEqual(grant.scope,fixed),'APPROVAL_SCOPE_MISMATCH')
      requireCheck(grant.status==='issued','APPROVAL_ALREADY_USED')
      const now=this.#clock()
      requireCheck(now>=grant.issued_ms&&now<grant.expires_ms,'APPROVAL_START_WINDOW_EXPIRED')
      requireCheck(!this.db.prepare('SELECT 1 FROM control_gate WHERE vm_id=?').get(fixed.vmId),'CONTROL_GATE_HELD')
      this.db.prepare('INSERT INTO control_gate VALUES (?,?,?)').run(fixed.vmId,'run',fixed.runId)
      this.db.prepare("UPDATE control_grants SET status='claimed' WHERE approval_id=?").run(approvalId)
      this.#event('run_claimed',approvalId)
      return this.get(approvalId)
    })
  }
  #claimed(approvalId){
    const grant=this.get(approvalId)
    const gate=this.db.prepare('SELECT * FROM control_gate WHERE vm_id=?').get(grant?.scope.vmId??'')
    requireCheck(grant?.status==='claimed'&&gate?.kind==='run'&&gate.owner_id===grant.run_id,'CLAIMED_RUN_REQUIRED')
    return grant
  }
  reserve(approvalId,step){
    return this.#tx(()=>{
      const grant=this.#claimed(approvalId)
      requireCheck(['prepare','inject','recover'].includes(step),'UNKNOWN_CONTROL_ACTION')
      requireCheck(!this.db.prepare("SELECT 1 FROM control_attempts WHERE approval_id=? AND status IN ('started','unknown')").get(approvalId),'ACTION_REQUIRES_RECONCILIATION')
      if(step==='inject')requireCheck(this.db.prepare("SELECT 1 FROM control_attempts WHERE approval_id=? AND step='prepare' AND status='pass'").get(approvalId),'PREPARE_NOT_VERIFIED')
      requireCheck(!this.db.prepare("SELECT 1 FROM control_attempts WHERE approval_id=? AND step='recover'").get(approvalId),'RECOVERY_ALREADY_ATTEMPTED')
      requireCheck(!this.db.prepare('SELECT 1 FROM control_attempts WHERE approval_id=? AND step=?').get(approvalId,step),'ACTION_ALREADY_ATTEMPTED')
      const id=randomUUID()
      this.db.prepare('INSERT INTO control_attempts VALUES (?,?,?,?)').run(id,approvalId,step,'started')
      this.#event('action_reserved',id,{approvalId,step})
      return {attemptId:id,operationId:grant.scope.actions[step]}
    })
  }
  finishAttempt(attemptId,outcome){
    requireCheck(['pass','fail','unknown'].includes(outcome),'INVALID_ACTION_OUTCOME')
    return this.#tx(()=>{
      const updated=this.db.prepare("UPDATE control_attempts SET status=? WHERE attempt_id=? AND status='started'").run(outcome,attemptId)
      requireCheck(updated.changes===1,'ATTEMPT_NOT_PENDING')
      this.#event('action_finished',attemptId,{outcome})
    })
  }
  complete(approvalId,proof){
    return this.#tx(()=>{
      const grant=this.#claimed(approvalId)
      requireCheck(proof?.runId===grant.run_id&&proof.vmId===grant.scope.vmId&&proof.checkpointId===grant.scope.checkpointId&&proof.baselineVerified===true,'BASELINE_PROOF_REQUIRED')
      requireCheck(this.db.prepare("SELECT 1 FROM control_attempts WHERE approval_id=? AND step='recover' AND status='pass'").get(approvalId),'RESET_NOT_VERIFIED')
      requireCheck(!this.db.prepare("SELECT 1 FROM control_attempts WHERE approval_id=? AND status IN ('started','unknown')").get(approvalId),'ACTION_REQUIRES_RECONCILIATION')
      this.db.prepare("UPDATE control_grants SET status='completed' WHERE approval_id=?").run(approvalId)
      this.db.prepare('DELETE FROM control_gate WHERE vm_id=?').run(grant.scope.vmId)
      this.#event('run_completed',approvalId,{baselineVerified:true,runId:proof.runId,vmId:proof.vmId,checkpointId:proof.checkpointId})
      return this.get(approvalId)
    })
  }
  acquireMaintenance(ownerId){
    requireCheck(uuid(ownerId),'INVALID_MAINTENANCE_OWNER')
    return this.#tx(()=>{
      requireCheck(!this.db.prepare('SELECT 1 FROM control_gate WHERE vm_id=?').get(LIVE_TARGET.vmId),'CONTROL_GATE_HELD')
      requireCheck(!this.db.prepare("SELECT 1 FROM control_grants WHERE status='claimed'").get(),'CLAIMED_RUN_REQUIRED_REVIEW')
      this.db.prepare('INSERT INTO control_gate VALUES (?,?,?)').run(LIVE_TARGET.vmId,'maintenance',ownerId)
      this.#event('maintenance_acquired',ownerId)
      return {ownerId,vmId:LIVE_TARGET.vmId,kind:'maintenance'}
    })
  }
  recordMaintenance(ownerId,stage){
    requireCheck(['legacy_state_clear','quiescing_legacy','legacy_quiesced','legacy_state_rechecked','installation_verifying','installation_verified','maintenance_failed'].includes(stage),'INVALID_MAINTENANCE_STAGE')
    return this.#tx(()=>{
      requireCheck(this.db.prepare("SELECT 1 FROM control_gate WHERE vm_id=? AND kind='maintenance' AND owner_id=?").get(LIVE_TARGET.vmId,ownerId),'MAINTENANCE_OWNER_MISMATCH')
      this.#event(stage,ownerId)
    })
  }
  releaseMaintenance(ownerId){
    return this.#tx(()=>{
      const result=this.db.prepare("DELETE FROM control_gate WHERE vm_id=? AND kind='maintenance' AND owner_id=?").run(LIVE_TARGET.vmId,ownerId)
      requireCheck(result.changes===1,'MAINTENANCE_OWNER_MISMATCH')
      this.#event('maintenance_released',ownerId)
    })
  }
}
