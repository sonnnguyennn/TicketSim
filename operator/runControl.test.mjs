import { expect,it } from 'vitest'
import { randomUUID } from 'node:crypto'
import { mkdtempSync,rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join,resolve,sep } from 'node:path'
import { Worker } from 'node:worker_threads'
import { RunControlJournal } from './runControl.mjs'
import { OperatorJournal } from './server.mjs'
import { getPackBlueprint } from '../agent/scenarioPacks.mjs'
import { LIVE_TARGET } from '../agent/livePolicy.mjs'
import { OperatorApprovalControl } from './approvalControl.mjs'
import { PairingManager } from '../agent/auth.mjs'
import { MaintenanceControl } from './maintenanceControl.mjs'

const principal='SONNGUYEN\\Admin'
const scope=()=>{const pack=getPackBlueprint('LAB-TLAB-002');return {scenarioId:pack.id,revision:pack.revision,runId:randomUUID(),bundleSha256:'a'.repeat(64),vmId:LIVE_TARGET.vmId,checkpointId:pack.checkpointId,actions:{...pack.actions}}}
async function fixture(work){
  const root=mkdtempSync(join(tmpdir(),'ticketsim-control-')),filename=join(root,'actions.sqlite')
  const journals=[]
  const open=options=>{const journal=new RunControlJournal(filename,options);journals.push(journal);return journal}
  try{await work({filename,open})}
  finally{
    for(const journal of journals)try{journal.close()}catch{/* restart fixture */}
    if(!resolve(root).startsWith(`${resolve(tmpdir())}${sep}ticketsim-control-`))throw new Error('UNSAFE_TEST_CLEANUP')
    rmSync(root,{recursive:true,force:true})
  }
}

it('binds approval to one run, pack revision, bundle and actions; rejects replay and drift',()=>fixture(({open})=>{
  const journal=open(),fixed=scope(),grant=journal.issue(fixed,{principal})
  for(const altered of [{...fixed,runId:randomUUID()},{...fixed,bundleSha256:'b'.repeat(64)}])expect(()=>journal.claim(grant.approval_id,altered)).toThrow('APPROVAL_SCOPE_MISMATCH')
  for(const altered of [{...fixed,vmId:LIVE_TARGET.protectedVmId},{...fixed,revision:2},{...fixed,actions:{...fixed.actions,inject:'arbitrary'}},{...fixed,command:'bash'}])expect(()=>journal.issue(altered,{principal})).toThrow()
  journal.claim(grant.approval_id,fixed)
  expect(()=>journal.claim(grant.approval_id,fixed)).toThrow('APPROVAL_ALREADY_USED')
  expect(()=>journal.acquireMaintenance(randomUUID())).toThrow('CONTROL_GATE_HELD')
  expect(()=>journal.issue(scope(),{principal})).toThrow('CONTROL_GATE_HELD')
}))

it('expires only new admission while allowing the already claimed run to recover after its window',()=>fixture(({open})=>{
  let now=1000
  const journal=open({now:()=>now}),fixed=scope(),grant=journal.issue(fixed,{principal,ttlMs:100})
  now=1100
  expect(()=>journal.claim(grant.approval_id,fixed)).toThrow('APPROVAL_START_WINDOW_EXPIRED')
  now=1050;journal.claim(grant.approval_id,fixed)
  now=999999
  const prepared=journal.reserve(grant.approval_id,'prepare');journal.finishAttempt(prepared.attemptId,'fail')
  const reset=journal.reserve(grant.approval_id,'recover');journal.finishAttempt(reset.attemptId,'pass')
  expect(()=>journal.reserve(grant.approval_id,'recover')).toThrow('RECOVERY_ALREADY_ATTEMPTED')
  expect(()=>journal.complete(grant.approval_id,{...fixed,baselineVerified:false})).toThrow('BASELINE_PROOF_REQUIRED')
  expect(journal.complete(grant.approval_id,{...fixed,baselineVerified:true}).status).toBe('completed')
  expect(journal.get(grant.approval_id).scope).toEqual(fixed)
  expect(journal.db.prepare('SELECT kind FROM control_events').all().map(row=>row.kind)).toEqual(['approval_issued','run_claimed','action_reserved','action_finished','action_reserved','action_finished','run_completed'])
}))

it('retains started/unknown actions across restart and never replays or resets through them',()=>fixture(({open})=>{
  const first=open(),fixed=scope(),grant=first.issue(fixed,{principal});first.claim(grant.approval_id,fixed)
  const attempt=first.reserve(grant.approval_id,'prepare');first.close()
  const second=open()
  for(const step of ['prepare','inject','recover'])expect(()=>second.reserve(grant.approval_id,step)).toThrow('ACTION_REQUIRES_RECONCILIATION')
  second.finishAttempt(attempt.attemptId,'unknown')
  expect(()=>second.reserve(grant.approval_id,'recover')).toThrow('ACTION_REQUIRES_RECONCILIATION')
  expect(()=>second.finishAttempt(attempt.attemptId,'pass')).toThrow('ATTEMPT_NOT_PENDING')
  expect(()=>second.complete(grant.approval_id,{...fixed,baselineVerified:true})).toThrow('RESET_NOT_VERIFIED')
  expect(()=>second.acquireMaintenance(randomUUID())).toThrow('CONTROL_GATE_HELD')
}))

it('does not alter legacy M3 approvals, actions or schema version when adding new tables',()=>fixture(({filename,open})=>{
  const legacy=new OperatorJournal(filename)
  try{
    const legacyRunId=randomUUID();legacy.claim('consumed-m3',legacyRunId)
    const before=legacy.db.prepare('SELECT * FROM approvals').all()
    const journal=open();journal.issue(scope(),{principal})
    expect(()=>journal.issue({...scope(),runId:legacyRunId},{principal})).toThrow('LEGACY_RUN_ALREADY_APPROVED')
    expect(legacy.db.prepare('SELECT * FROM approvals').all()).toEqual(before)
    expect(legacy.db.prepare('SELECT * FROM actions').all()).toEqual([])
    expect(legacy.db.prepare('PRAGMA user_version').get().user_version).toBe(0)
  }finally{legacy.close()}
}))

it('keeps maintenance ownership durable, denies stale owners and blocks previously issued grants',()=>fixture(({open})=>{
  const first=open(),fixed=scope(),grant=first.issue(fixed,{principal}),owner=randomUUID()
  first.acquireMaintenance(owner);first.close()
  const second=open()
  expect(()=>second.claim(grant.approval_id,fixed)).toThrow('CONTROL_GATE_HELD')
  expect(()=>second.releaseMaintenance(randomUUID())).toThrow('MAINTENANCE_OWNER_MISMATCH')
  expect(()=>second.acquireMaintenance(randomUUID())).toThrow('CONTROL_GATE_HELD')
  second.releaseMaintenance(owner);second.claim(grant.approval_id,fixed)
}))

function workerRace(filename,mode,grant,fixed,ready,go){
  return new Promise((resolve,reject)=>{
    const worker=new Worker(`const {parentPort,workerData}=require('node:worker_threads');
      (async()=>{const {RunControlJournal}=await import(workerData.module);const j=new RunControlJournal(workerData.filename);
      parentPort.postMessage('ready');await new Promise(r=>parentPort.once('message',r));
      let result;try{workerData.mode==='claim'?j.claim(workerData.grant,workerData.scope):j.acquireMaintenance(workerData.owner);result='won'}catch(e){result=e.message}finally{j.close()}
      parentPort.postMessage(result)})().catch(e=>{throw e})`,{eval:true,workerData:{module:new URL('./runControl.mjs',import.meta.url).href,filename,mode,grant,scope:fixed,owner:randomUUID()}})
    worker.on('error',reject)
    worker.on('message',message=>{if(message==='ready'){ready();go.then(()=>worker.postMessage('go'))}else resolve(message)})
    worker.on('exit',code=>{if(code!==0)reject(new Error(`CONTROL_WORKER_EXIT_${code}`))})
  })
}
it('serializes an actual concurrent claim and maintenance request from separate SQLite connections',()=>fixture(async({filename,open})=>{
  const journal=open(),fixed=scope(),grant=journal.issue(fixed,{principal})
  let count=0,release,allReady
  const ready=new Promise(r=>{allReady=r}),go=new Promise(r=>{release=r})
  const arrive=()=>{if(++count===2)allReady()}
  const tasks=[workerRace(filename,'claim',grant.approval_id,fixed,arrive,go),workerRace(filename,'maintenance',grant.approval_id,fixed,arrive,go)]
  await ready;release()
  expect((await Promise.all(tasks)).sort()).toEqual(['CONTROL_GATE_HELD','won'])
}))

function controller(journal,options={}){
  const control=new OperatorApprovalControl({journal,principal,resolveRelease:id=>({qualified:true,scenarioId:id,revision:1,bundleSha256:'a'.repeat(64)}),inspectLegacy:()=>({stateClear:true,mutationAuthorized:false}),pairingCode:'operator-bootstrap-test-only',...options})
  const paired=control.auth.pair('operator-bootstrap-test-only')
  const credentials={authorization:`Bearer ${paired.token}`,csrf:control.auth.session.csrf}
  return {control,credentials}
}
it('requires separate Operator pairing, CSRF and exact proposal consent; refuses reapproval',()=>fixture(({open})=>{
  const journal=open(),{control,credentials}=controller(journal)
  const learner=new PairingManager({pairingCode:'learner'}).pair('learner')
  expect(()=>control.propose({authorization:`Bearer ${learner.token}`,csrf:credentials.csrf},{scenarioId:'LAB-TLAB-002'})).toThrow('UNAUTHORIZED')
  expect(()=>control.propose({...credentials,csrf:'bad'},{scenarioId:'LAB-TLAB-002'})).toThrow('OPERATOR_CSRF_REQUIRED')
  const proposal=control.propose(credentials,{scenarioId:'LAB-TLAB-002'})
  expect(()=>control.approve(credentials,{proposalId:proposal.proposalId,consent:'YES'})).toThrow('EXACT_OPERATOR_CONSENT_REQUIRED')
  const grant=control.approve(credentials,{proposalId:proposal.proposalId,consent:proposal.consent})
  expect(grant.scope).toEqual(proposal.scope)
  expect(()=>control.approve(credentials,{proposalId:proposal.proposalId,consent:proposal.consent})).toThrow('APPROVAL_PROPOSAL_EXPIRED_OR_UNKNOWN')
}))

it('rejects planned releases, changed bundles, dirty legacy state and expired operator sessions',()=>fixture(({open})=>{
  const journal=open()
  const planned=controller(journal,{resolveRelease:()=>({qualified:false})})
  expect(()=>planned.control.propose(planned.credentials,{scenarioId:'LAB-TLAB-002'})).toThrow('SCENARIO_RELEASE_NOT_QUALIFIED')
  let digest='a'.repeat(64),clear=true,now=1000
  const {control,credentials}=controller(journal,{now:()=>now,resolveRelease:id=>({qualified:true,scenarioId:id,revision:1,bundleSha256:digest}),inspectLegacy:()=>({stateClear:clear,mutationAuthorized:false})})
  const proposal=control.propose(credentials,{scenarioId:'LAB-TLAB-003'}),consent={proposalId:proposal.proposalId,consent:proposal.consent}
  digest='b'.repeat(64);expect(()=>control.approve(credentials,consent)).toThrow('SCENARIO_RELEASE_CHANGED')
  digest='a'.repeat(64);clear=false;expect(()=>control.approve(credentials,consent)).toThrow('LEGACY_RUNTIME_REQUIRES_REVIEW')
  clear=true;now+=5*60_000;expect(()=>control.approve(credentials,consent)).toThrow('UNAUTHORIZED')
  expect(journal.db.prepare('SELECT COUNT(*) n FROM control_grants').get().n).toBe(0)
}))

it('rechecks the protected release at claim, not only when consent was given',()=>fixture(({open})=>{
  let digest='a'.repeat(64)
  const journal=open(),{control,credentials}=controller(journal,{resolveRelease:id=>({qualified:true,scenarioId:id,revision:1,bundleSha256:digest})})
  const proposal=control.propose(credentials,{scenarioId:'LAB-TLAB-007'})
  const grant=control.approve(credentials,{proposalId:proposal.proposalId,consent:proposal.consent})
  digest='b'.repeat(64)
  expect(()=>control.claimApproved(grant.approval_id,grant.run_id)).toThrow('SCENARIO_RELEASE_CHANGED')
  digest='a'.repeat(64)
  expect(control.claimApproved(grant.approval_id,grant.run_id).status).toBe('claimed')
}))

it('checks legacy state before and after quiescence while the new admission gate is held',()=>fixture(async({open})=>{
  const journal=open(),calls=[]
  const control=new MaintenanceControl({journal,inspectLegacy:async()=>{calls.push('inspect');expect(()=>journal.issue(scope(),{principal})).toThrow('CONTROL_GATE_HELD');return {stateClear:true}},quiesceLegacy:async()=>{calls.push('quiesce');return {admissionQuiesced:true}}})
  const lock=await control.acquire()
  expect(calls).toEqual(['inspect','quiesce','inspect'])
  await control.releaseAfterVerification(lock,async()=>({verified:true}))
  expect(journal.issue(scope(),{principal}).status).toBe('issued')
}))

it('retains the maintenance lock after ambiguous quiescence and does not call stop on dirty state',()=>fixture(async({open})=>{
  const journal=open();let stopped=false
  const dirty=new MaintenanceControl({journal,inspectLegacy:async()=>({stateClear:false}),quiesceLegacy:async()=>{stopped=true;return {admissionQuiesced:true}}})
  await expect(dirty.acquire()).rejects.toThrow('LEGACY_RUNTIME_REQUIRES_REVIEW_GATE_RETAINED')
  expect(stopped).toBe(false)
  expect(()=>journal.issue(scope(),{principal})).toThrow('CONTROL_GATE_HELD')
}))

it('keeps ambiguous stop and failed installation verification locked with durable stage evidence',()=>fixture(async({open})=>{
  const journal=open()
  const ambiguous=new MaintenanceControl({journal,inspectLegacy:async()=>({stateClear:true}),quiesceLegacy:async()=>{throw new Error('STOP_RESULT_UNKNOWN')}})
  await expect(ambiguous.acquire()).rejects.toThrow('STOP_RESULT_UNKNOWN')
  const gate=journal.db.prepare('SELECT * FROM control_gate').get()
  expect(journal.db.prepare('SELECT kind FROM control_events').all().map(row=>row.kind)).toEqual(['maintenance_acquired','legacy_state_clear','quiescing_legacy','maintenance_failed'])
  expect(()=>journal.issue(scope(),{principal})).toThrow('CONTROL_GATE_HELD')
  // Explicit synthetic reconciliation of a test lock, never an actual host stop.
  journal.releaseMaintenance(gate.owner_id)
  const clean=new MaintenanceControl({journal,inspectLegacy:async()=>({stateClear:true}),quiesceLegacy:async()=>({admissionQuiesced:true})})
  const lock=await clean.acquire()
  await expect(clean.releaseAfterVerification(lock,async()=>({verified:false}))).rejects.toThrow('INSTALLATION_NOT_VERIFIED_GATE_RETAINED')
  expect(()=>journal.issue(scope(),{principal})).toThrow('CONTROL_GATE_HELD')
}))
