import { afterEach, describe, expect, it } from 'vitest'
import { LabStore } from './store.mjs'
import { LiveLabService } from './liveService.mjs'
import { LIVE_TARGET, checkVerdict, liveChecks } from './livePolicy.mjs'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const stores = []
const dirs = []
afterEach(() => { for (const store of stores.splice(0)) { try { store.close() } catch { /* closed for restart */ } }; for (const dir of dirs.splice(0)) rmSync(dir,{recursive:true,force:true}) })
const store = () => { const value = new LabStore(':memory:'); stores.push(value); return value }
const approval = {
  scenarioId: 'LAB-WEB-001', vmId: LIVE_TARGET.vmId, checkpointId: '00000000-0000-4000-8000-000000000002',
  b5Status: 'PASS', firstTrialApproved: true, resetApproved: true, approvalId: 'first-trial-0001',
  baselineHashes: { sshConfig: 'a'.repeat(64), firewall: 'b'.repeat(64) },
  b5Evidence: { status:'PASS', vmId: LIVE_TARGET.vmId, appliedCheckpointId: '00000000-0000-4000-8000-000000000002', markerAbsent:true, sshAuthenticated:true, http200Exact:true, pageSha256:LIVE_TARGET.pageSha256, backupVhdSha256:LIVE_TARGET.backupVhdSha256, noOtherVmChanged:true, finalState:'Running', sshConfigSha256:'a'.repeat(64), firewallSha256:'b'.repeat(64) },
}
const key = n => `real_request_${String(n).padStart(8,'0')}`
const passing = stage => Object.fromEntries(liveChecks[stage].map(name => [name,'pass']))
function operations({ failAt = null, mutate = null } = {}) {
  const calls = []; let faulted = false
  return {
    calls,
    async claim() { calls.push('claim'); if (failAt === 'claim') throw new Error('claim failed') },
    async observe(stage) {
      calls.push(`observe:${stage}`)
      if (failAt === `observe:${stage}`) throw new Error('probe failed')
      const checks = passing(stage)
      if (mutate) mutate(stage,checks)
      if (stage === 'fault' && !faulted) checks.nginxStopped = 'fail'
      return { vmId: LIVE_TARGET.vmId, checkpointId: approval.checkpointId, recoveryVmId: LIVE_TARGET.recoveryVmId, protectedVmId: LIVE_TARGET.protectedVmId, checks }
    },
    async inject() { calls.push('inject'); if (failAt === 'inject') throw new Error('injection failed'); faulted = true },
    async reset() { calls.push('reset'); if (failAt === 'reset') throw new Error('reset failed') },
  }
}

describe('real LAB-WEB-001 lifecycle with isolated operation fakes', () => {
  it('records live grade then reset verification and releases the lease', async () => {
    const db = store(), ops = operations(), service = new LiveLabService(db,ops,approval)
    const run = await service.start('LAB-WEB-001',key(1))
    expect(run).toMatchObject({ mode:'real', phase:'running' })
    expect(ops.calls).toEqual(['observe:preflight','claim','observe:preflight','inject','observe:fault'])
    const completed = await service.submit(run.run_id,key(2),'HTTP 200 and exact page checked from client')
    expect(completed).toMatchObject({ phase:'completed', grade_status:'pass', recovery_status:'verified', evidence_note:'HTTP 200 and exact page checked from client' })
    expect(db.getLease(run.vm_ref)).toBeNull()
    expect(db.getEvents(run.run_id).some(event => event.metadata.simulated === false && event.event_type === 'baseline_checked')).toBe(true)
    expect(db.getEvents(run.run_id).find(event => event.event_type === 'grade_recorded').metadata.score).toBe(65)
  })
  it.each([
    ['vmIdentity','wrong VM ID'],['checkpointIdentity','wrong checkpoint ID'],['protectedIdentity','protected VM selection'],
    ['backupHash','backup mismatch or missing'],['hostRam','insufficient RAM'],['diskC','low C storage'],['diskE','low E storage'],
    ['sshAuthentication','SSH unavailable'],['httpContent','baseline mismatch'],
  ])('blocks %s before injecting (%s)', async name => {
    const db=store(),ops=operations({mutate:(stage,checks)=>{ if(stage==='preflight') checks[name]='fail' }}),service=new LiveLabService(db,ops,approval)
    await expect(service.start('LAB-WEB-001',key(3))).rejects.toThrow('LIVE_PREFLIGHT_FAIL')
    expect(ops.calls).toEqual(['observe:preflight'])
    expect(db.listRuns()).toHaveLength(0)
  })
  it('blocks missing B5 and first-trial authorization', async () => {
    const db=store(),ops=operations()
    await expect(new LiveLabService(db,ops,{...approval,b5Status:'UNKNOWN'}).start('LAB-WEB-001',key(4))).rejects.toThrow('LIVE_APPROVAL_MISSING')
    await expect(new LiveLabService(db,ops,{...approval,firstTrialApproved:false}).start('LAB-WEB-001',key(5))).rejects.toThrow('LIVE_APPROVAL_MISSING')
    expect(ops.calls).toHaveLength(0)
  })
  it('quarantines when fault injection fails and reset fails', async () => {
    const db=store(),ops=operations({failAt:'inject'}),service=new LiveLabService(db,ops,approval)
    const run=await service.start('LAB-WEB-001',key(6))
    expect(run.phase).toBe('completed')
    expect(run.error_code).toBe('LIVE_SETUP_ERROR')
    expect(ops.calls).toContain('reset')
    const other=operations({failAt:'reset'}), blocked=new LiveLabService(store(),other,approval)
    const failed=await blocked.start('LAB-WEB-001',key(7))
    // The fresh run reaches the learner and a failed host reset retains its lease.
    const result=await blocked.submit(failed.run_id,key(8),'')
    expect(result.phase).toBe('restore_failed')
    expect(blocked.store.getLease(failed.vm_ref).lease_state).toBe('unknown')
    await expect(blocked.start('LAB-WEB-001',key(9))).rejects.toThrow('VM_LEASE_HELD')
  })
  it('does not open learner access when fault or SSH verification is unknown', async () => {
    const db=store(),ops=operations({mutate:(stage,checks)=>{if(stage==='fault') checks.sshAuthentication='unknown'}}),service=new LiveLabService(db,ops,approval)
    const run=await service.start('LAB-WEB-001',key(10))
    expect(run.phase).toBe('completed')
    expect(run.error_code).toBe('LIVE_FAULT_NOT_VERIFIED')
    expect(ops.calls).toContain('reset')
  })
  it('captures grader UNKNOWN and never infers PASS from absent HTTP', async () => {
    const db=store(),ops=operations({mutate:(stage,checks)=>{if(stage==='grade') checks.httpStatus='unknown'}}),service=new LiveLabService(db,ops,approval)
    const run=await service.start('LAB-WEB-001',key(11))
    const done=await service.submit(run.run_id,key(12),'')
    expect(done.grade_status).toBe('unknown')
    expect(done.phase).toBe('completed')
    expect(checkVerdict({},liveChecks.grade)).toBe('unknown')
  })
  it('keeps lease on baseline mismatch and deduplicates start/submit', async () => {
    const db=store(),ops=operations({mutate:(stage,checks)=>{if(stage==='reset') checks.pageHash='fail'}}),service=new LiveLabService(db,ops,approval)
    const run=await service.start('LAB-WEB-001',key(13))
    expect((await service.start('LAB-WEB-001',key(13))).run_id).toBe(run.run_id)
    const failed=await service.submit(run.run_id,key(14),'verified')
    expect(failed.phase).toBe('restore_failed')
    expect((await service.submit(run.run_id,key(14),'verified')).event_sequence).toBe(failed.event_sequence)
    expect(db.getLease(run.vm_ref).lease_state).toBe('unknown')
  })
  it('rejects wrong IDs in fresh observations', async () => {
    const db=store(),ops=operations(), original=ops.observe.bind(ops)
    ops.observe=async stage=>({...await original(stage),vmId:LIVE_TARGET.protectedVmId})
    await expect(new LiveLabService(db,ops,approval).start('LAB-WEB-001',key(15))).rejects.toThrow('LIVE_IDENTITY_MISMATCH')
    expect(ops.calls).toEqual(['observe:preflight'])
  })
  it('times out an abandoned learner run and makes one approved reset attempt', async () => {
    const db=store(),ops=operations(),service=new LiveLabService(db,ops,approval)
    const run=await service.start('LAB-WEB-001',key(16))
    await service.expireOverdue(Date.parse(run.started_at)+26*60_000)
    expect(db.getRun(run.run_id)).toMatchObject({phase:'completed',grade_status:'unknown',error_code:'LEARNER_TIMEOUT'})
    expect(ops.calls.filter(call=>call==='reset')).toHaveLength(1)
    await service.expireOverdue(Date.parse(run.started_at)+27*60_000)
    expect(ops.calls.filter(call=>call==='reset')).toHaveLength(1)
  })
  it('quarantines an interrupted live run across agent restart', async () => {
    const dir=mkdtempSync(path.join(tmpdir(),'ticketsim-real-restart-'));dirs.push(dir)
    const file=path.join(dir,'runs.sqlite')
    const first=new LabStore(file);stores.push(first)
    const run=await new LiveLabService(first,operations(),approval).start('LAB-WEB-001',key(17))
    first.close()
    const reopened=new LabStore(file);stores.push(reopened)
    reopened.markInterruptedOnStartup()
    expect(reopened.getRun(run.run_id)).toMatchObject({phase:'recovery_required',recovery_status:'unknown',mode:'real'})
    expect(reopened.getLease(run.vm_ref).lease_state).toBe('unknown')
    expect(reopened.getEvents(run.run_id).at(-1).metadata.simulated).toBe(false)
    await expect(new LiveLabService(reopened,operations(),approval).start('LAB-WEB-001',key(18))).rejects.toThrow('VM_LEASE_HELD')
  })
})
