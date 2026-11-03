import { expect,it } from 'vitest'
import { mkdtempSync,rmSync,writeFileSync,readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join,resolve,sep } from 'node:path'
import { LabStore } from './store.mjs'
import { OperatorJournal } from '../operator/server.mjs'
import { inspectMaintenanceState } from './runtimeMaintenance.mjs'
import { RunControlJournal } from '../operator/runControl.mjs'
import { randomUUID } from 'node:crypto'
import { getPackBlueprint } from './scenarioPacks.mjs'
import { LIVE_TARGET } from './livePolicy.mjs'

function fixture(work){
  const root=mkdtempSync(join(tmpdir(),'ticketsim-maintenance-'))
  const paths={agentPath:join(root,'agent.sqlite'),operatorPath:join(root,'operator.sqlite'),b5LeasePath:join(root,'exclusive-lease')}
  let agent,operator
  try{agent=new LabStore(paths.agentPath);operator=new OperatorJournal(paths.operatorPath);work({paths,agent,operator})}
  finally{
    operator?.close();agent?.close()
    if(!resolve(root).startsWith(`${resolve(tmpdir())}${sep}ticketsim-maintenance-`))throw new Error('UNSAFE_TEST_CLEANUP')
    rmSync(root,{recursive:true,force:true})
  }
}
const id='76213ef3-ef9b-4bd2-9cb6-6c508dc2a92c'
function completed(agent,operator){
  agent.createRun({runId:id,scenarioId:'LAB-WEB-001',scenarioVersion:2,target:{vmRef:'hyperv:test',controller:'hyperv',disposable:true},requestKey:'maintenance-test-request',at:new Date().toISOString(),mode:'real'})
  // Synthetic completed-history fixture, not an actual recovery operation.
  agent.db.prepare("UPDATE lab_runs SET phase='completed',recovery_status='verified',completed_at=? WHERE run_id=?").run(new Date().toISOString(),id)
  agent.db.exec('DELETE FROM vm_leases')
  operator.claim('consumed-m3-permit',id)
  const action=operator.reserve('consumed-m3-permit',id,'real-host-reset-v1')
  operator.finish(action,'pass');operator.finalize('consumed-m3-permit',id)
}

it('accepts completed consumed history for inspection without erasing or rearming it',()=>fixture(({paths,agent,operator})=>{
  completed(agent,operator)
  const before=agent.db.prepare('SELECT * FROM lab_runs').all()
  const claims=operator.db.prepare('SELECT * FROM approvals').all()
  const report=inspectMaintenanceState(paths)
  expect(report).toMatchObject({stateClear:true,mutationAuthorized:false,completedRealRuns:1,preservedApprovalIds:['consumed-m3-permit']})
  expect(agent.db.prepare('SELECT * FROM lab_runs').all()).toEqual(before)
  expect(operator.db.prepare('SELECT * FROM approvals').all()).toEqual(claims)
}))

it('blocks active/quarantined runs and leases, pending/unknown operations and B5 lease',()=>fixture(({paths,agent,operator})=>{
  completed(agent,operator)
  agent.db.prepare("UPDATE lab_runs SET phase='restore_failed',recovery_status='failed' WHERE run_id=?").run(id)
  agent.db.prepare('INSERT INTO vm_leases VALUES (?,?,?,?)').run('hyperv:test',id,'unknown',new Date().toISOString())
  agent.acceptOperation('pending-maintenance-test','submit',id)
  writeFileSync(paths.b5LeasePath,'preserve')
  expect(inspectMaintenanceState(paths).blockers).toEqual(expect.arrayContaining(['B5_LEASE_HELD','VM_LEASE_HELD','REAL_RUN_NOT_VERIFIED_COMPLETE','OPERATION_UNRESOLVED']))
  agent.db.exec("UPDATE web_operations SET status='unknown'")
  expect(inspectMaintenanceState(paths).blockers).toContain('OPERATION_UNRESOLVED')
  expect(readFileSync(paths.b5LeasePath,'utf8')).toBe('preserve')
}))

it('requires finalization and successful single reset evidence, failing closed on unfamiliar statuses',()=>fixture(({paths,agent,operator})=>{
  completed(agent,operator)
  operator.db.exec("UPDATE approvals SET finalized_at=NULL; UPDATE actions SET status='started'")
  expect(inspectMaintenanceState(paths).blockers).toEqual(expect.arrayContaining(['OPERATOR_CLAIM_UNRESOLVED','OPERATOR_ACTION_UNRESOLVED','REAL_RUN_NOT_FINALIZED','RESET_EVIDENCE_NOT_VERIFIED']))
  agent.db.exec("INSERT INTO web_operations VALUES ('future-status','start',NULL,'future',NULL,'now')")
  expect(inspectMaintenanceState(paths).blockers).toContain('OPERATION_UNRESOLVED')
}))

it('does not create missing databases and refuses unrecognized versions',()=>fixture(({paths,agent})=>{
  expect(()=>inspectMaintenanceState({...paths,agentPath:join(paths.agentPath,'absent')})).toThrow('MAINTENANCE_DATABASE_MISSING')
  agent.db.exec('PRAGMA user_version=99')
  expect(()=>inspectMaintenanceState(paths)).toThrow('MAINTENANCE_DATABASE_VERSION_UNSUPPORTED')
}))

it('also blocks durable M4 gates and ambiguous actions without hiding a foreign maintenance owner',()=>fixture(({paths})=>{
  const journal=new RunControlJournal(paths.operatorPath)
  try{
    const owner=randomUUID();journal.acquireMaintenance(owner)
    expect(inspectMaintenanceState(paths).blockers).toContain('CONTROL_GATE_HELD')
    expect(inspectMaintenanceState({...paths,ownedMaintenanceId:owner}).stateClear).toBe(true)
    expect(inspectMaintenanceState({...paths,ownedMaintenanceId:randomUUID()}).blockers).toContain('MAINTENANCE_OWNER_MISMATCH')
    journal.releaseMaintenance(owner)
    const pack=getPackBlueprint('LAB-TLAB-002')
    const scope={scenarioId:pack.id,revision:pack.revision,runId:randomUUID(),bundleSha256:'a'.repeat(64),vmId:LIVE_TARGET.vmId,checkpointId:pack.checkpointId,actions:{...pack.actions}}
    const grant=journal.issue(scope,{principal:'SONNGUYEN\\Admin'});journal.claim(grant.approval_id,scope)
    journal.reserve(grant.approval_id,'prepare')
    expect(inspectMaintenanceState(paths).blockers).toEqual(expect.arrayContaining(['CONTROL_GATE_HELD','CONTROL_RUN_UNRESOLVED','CONTROL_ACTION_UNRESOLVED']))
  }finally{journal.close()}
}))
