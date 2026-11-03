import { readActiveUpgrade,assertRetiredContinuation } from '../../operator/upgradeRecovery.mjs'
import { verifyRelease } from '../../operator/bootstrapPolicy.mjs'
import { readQualifiedTrialReport } from '../../operator/qualifiedRuntime.mjs'
import { inspectMaintenanceState } from '../../agent/runtimeMaintenance.mjs'
import { DatabaseSync } from 'node:sqlite'
import { existsSync } from 'node:fs'
import { safeUpgradeFailure } from '../../operator/upgradeDiagnostics.mjs'

const root='C:/ProgramData/TicketSimPilot'
let stage='read_upgrade_record'
async function main(){
const {record}=readActiveUpgrade(root)
stage='verify_immutable_release'
verifyRelease(record.releaseRoot,record.manifestSha256)
stage='inspect_retired_state'
const db=new DatabaseSync(`${root}/operator/actions.sqlite`,{readOnly:true})
try{
  db.exec('PRAGMA query_only=ON')
  const state=inspectMaintenanceState({agentPath:`${root}/agent/runs.sqlite`,operatorPath:`${root}/operator/actions.sqlite`,b5LeasePath:'E:/TicketSimOperatorState/b5/exclusive-lease',ownedMaintenanceId:record.ownerId})
  assertRetiredContinuation({record,gates:db.prepare('SELECT * FROM control_gate').all(),events:db.prepare('SELECT kind,reference_id FROM control_events ORDER BY sequence').all(),stateClear:state.stateClear,
    continuationExists:existsSync(`${root}/operator/m4-retired-continuation.json`),grants:db.prepare('SELECT COUNT(*) n FROM control_grants').get().n,attempts:db.prepare('SELECT COUNT(*) n FROM control_attempts').get().n})
  stage='read_actual_m3_host'
  const report=await readQualifiedTrialReport()
  if(report.livePass!==true||report.runId!=='76213ef3-ef9b-4bd2-9cb6-6c508dc2a92c'||report.b5LeaseExists)throw new Error('M3_NOT_VERIFIED')
  process.stdout.write(`${JSON.stringify({eligible:true,phase:record.phase,releaseRoot:record.releaseRoot,ownerId:record.ownerId,livePass:true,readOnly:true})}\n`)
}finally{db.close()}
}
main().catch(error=>{
  // The old report CLI hides its cause. Never expose child stderr or a raw
  // execFileSync error dump; diagnose separately without starting services.
  process.stderr.write(`${JSON.stringify({eligible:false,readOnly:true,stage,failure:safeUpgradeFailure(error),continuationExists:existsSync(`${root}/operator/m4-retired-continuation.json`),noStart:true})}\n`)
  process.exitCode=1
})
