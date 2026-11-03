import { expect,it } from 'vitest'
import { mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join,resolve,sep } from 'node:path'
import { RunControlJournal } from './runControl.mjs'
import { inspectUpgradeFailure,safeUpgradeFailure } from './upgradeDiagnostics.mjs'
import { randomUUID } from 'node:crypto'

it('classifies child/SQLite failures without exposing stderr, JSON content or credentials',()=>{
  const secret='PRIVATE_TOKEN_OR_PASSWORD'
  const failure=safeUpgradeFailure({name:'Error',code:1,stderr:`${secret} CHECKPOINT_ID_MISMATCH`,message:secret,signal:'SIGTERM',killed:true})
  expect(failure).toMatchObject({code:'CHECKPOINT_ID_MISMATCH',exitCode:1,signal:'SIGTERM',killed:true})
  expect(JSON.stringify(failure)).not.toContain(secret)
  expect(JSON.stringify(safeUpgradeFailure(new Error(secret)))).not.toContain(secret)
  expect(safeUpgradeFailure({name:'SyntaxError',message:`Unexpected token ${secret}`})).toMatchObject({name:'SyntaxError',code:'UNCLASSIFIED_FAILURE'})
  expect(safeUpgradeFailure({code:'ERR_SQLITE_ERROR',errcode:5,message:'database is locked'}).sqliteCode).toBe(5)
})

it('reads BOM metadata, retained gate and stages without editing records or returning learner notes',async()=>{
  const root=mkdtempSync(join(tmpdir(),'ticketsim-upgrade-diag-'));mkdirSync(join(root,'operator'))
  const filename=join(root,'operator','m4-upgrade.json'),owner=randomUUID()
  const original='\ufeff'+JSON.stringify({phase:'locked',ownerId:owner,releaseRoot:'protected-release'})
  writeFileSync(filename,original)
  for(const name of ['m1-evidence.json','processes.json','preparation.json'])writeFileSync(join(root,'operator',name),'{}')
  const journal=new RunControlJournal(join(root,'operator','actions.sqlite'));journal.acquireMaintenance(owner)
  try{
    const before=journal.db.prepare('SELECT * FROM control_events').all()
    const result=await inspectUpgradeFailure({stateRoot:root,readReport:async()=>({livePass:true,runId:'test',verificationNote:'PRIVATE_NOTE'}),inspectState:()=>({stateClear:true})})
    expect(result.evidenceFiles.upgrade).toEqual({readable:true,utf8Bom:true})
    expect(result.control.gates[0].owner_id).toBe(owner)
    expect(readFileSync(filename,'utf8')).toBe(original)
    expect(journal.db.prepare('SELECT * FROM control_events').all()).toEqual(before)
    expect(JSON.stringify(result)).not.toContain('PRIVATE_NOTE')
  }finally{
    journal.close()
    if(!resolve(root).startsWith(`${resolve(tmpdir())}${sep}ticketsim-upgrade-diag-`))throw new Error('UNSAFE_TEST_CLEANUP')
    rmSync(root,{recursive:true,force:true})
  }
})
