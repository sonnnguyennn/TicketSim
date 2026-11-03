import { expect,it } from 'vitest'
import { mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join,resolve,sep } from 'node:path'
import { randomUUID } from 'node:crypto'
import { assertLockedRecovery,readActiveUpgrade,evidenceHash } from './upgradeRecovery.mjs'
import { RunControlJournal } from './runControl.mjs'
import { withQualifiedPowerShell,readQualifiedTrialReport,QUALIFIED_PWSH } from './qualifiedRuntime.mjs'
import { LIVE_TARGET } from '../agent/livePolicy.mjs'

const original=()=>({phase:'locked',ownerId:randomUUID(),releaseRoot:'failed-release',manifestSha256:'a'.repeat(64)})
const eligible=record=>({original:record,gates:[{vm_id:LIVE_TARGET.vmId,kind:'maintenance',owner_id:record.ownerId}],events:[{kind:'maintenance_acquired',reference_id:record.ownerId},{kind:'maintenance_failed',reference_id:record.ownerId}],archiveExists:{m1:false,processes:false},stateClear:true,resumeExists:false,grants:0,attempts:0})

it('allows only the precise pre-retirement failure, never active, advanced or ambiguous recovery',()=>{
  const record=original(),input=eligible(record)
  expect(assertLockedRecovery(input)).toBe(true)
  for(const patch of [{original:{...record,phase:'retiring'}},{resumeExists:true},{grants:1},{attempts:1},{stateClear:false},{archiveExists:{m1:true,processes:false}},{gates:[]},{gates:[{kind:'maintenance',owner_id:randomUUID()}]},{events:[...input.events,{kind:'quiescing_legacy',reference_id:record.ownerId}]}])expect(()=>assertLockedRecovery({...input,...patch})).toThrow()
})

it('retains the same durable gate owner across reviewed resume and records it without reacquisition',()=>{
  const journal=new RunControlJournal(':memory:'),record=original()
  try{
    journal.acquireMaintenance(record.ownerId);journal.recordMaintenance(record.ownerId,'maintenance_failed')
    expect(assertLockedRecovery({...eligible(record),gates:journal.db.prepare('SELECT * FROM control_gate').all(),events:journal.db.prepare('SELECT kind,reference_id FROM control_events ORDER BY sequence').all()})).toBe(true)
    journal.recordMaintenance(record.ownerId,'maintenance_resume_reviewed')
    expect(journal.db.prepare('SELECT owner_id FROM control_gate').get().owner_id).toBe(record.ownerId)
    expect(journal.db.prepare("SELECT COUNT(*) n FROM control_events WHERE kind='maintenance_acquired'").get().n).toBe(1)
  }finally{journal.close()}
})

it('selects the resume record only while its original immutable evidence remains byte-identical',()=>{
  const root=mkdtempSync(join(tmpdir(),'ticketsim-upgrade-chain-'));mkdirSync(join(root,'operator'))
  const filename=join(root,'operator/m4-upgrade.json'),resume=join(root,'operator/m4-resume.json'),record=original(),bytes=JSON.stringify(record)
  try{
    writeFileSync(filename,bytes)
    expect(readActiveUpgrade(root).record.phase).toBe('locked')
    writeFileSync(resume,JSON.stringify({...record,releaseRoot:'new-release',phase:'installed',resumedFrom:{releaseRoot:record.releaseRoot,manifestSha256:record.manifestSha256,recordSha256:evidenceHash(bytes)}}))
    expect(readActiveUpgrade(root).record.phase).toBe('installed')
    expect(readFileSync(filename,'utf8')).toBe(bytes)
    writeFileSync(filename,bytes+' ')
    expect(()=>readActiveUpgrade(root)).toThrow('UPGRADE_RECOVERY_CHAIN_CHANGED')
  }finally{
    if(!resolve(root).startsWith(`${resolve(tmpdir())}${sep}ticketsim-upgrade-chain-`))throw new Error('UNSAFE_TEST_CLEANUP')
    rmSync(root,{recursive:true,force:true})
  }
})

it('uses the already-qualified original report and PowerShell, verifies hashes first and restores environment',async()=>{
  const env={TICKETSIM_PWSH:'new-unqualified-copy',PSModulePath:'new-modules'},calls=[]
  const report=await readQualifiedTrialReport({env,verify:()=>calls.push('verify'),run:(file,args,options)=>{
    calls.push('worker');expect(env.TICKETSIM_PWSH).toBe(QUALIFIED_PWSH)
    expect(env.PSModulePath).toContain('TicketSimPilot\\powershell\\Modules')
    expect(file).toBe('C:\\Program Files\\TicketSimPilot\\node.exe')
    expect(args).toEqual(['C:\\Program Files\\TicketSimPilot\\agent\\trialReport.mjs'])
    expect(options.timeout).toBe(180_000)
    return '{"livePass":true}'
  }})
  expect(report.livePass).toBe(true);expect(calls).toEqual(['verify','worker'])
  expect(env).toEqual({TICKETSIM_PWSH:'new-unqualified-copy',PSModulePath:'new-modules'})
  await expect(withQualifiedPowerShell(()=>{throw new Error('INSPECT_FAILED')},{verify:()=>{},env})).rejects.toThrow('INSPECT_FAILED')
  expect(env.TICKETSIM_PWSH).toBe('new-unqualified-copy')
})

it('does not load any host inspection code if the qualified runtime integrity check fails',async()=>{
  let loaded=false
  await expect(readQualifiedTrialReport({verify:()=>{throw new Error('QUALIFIED_RUNTIME_HASH_CHANGED')},run:()=>{loaded=true}})).rejects.toThrow('QUALIFIED_RUNTIME_HASH_CHANGED')
  expect(loaded).toBe(false)
})
