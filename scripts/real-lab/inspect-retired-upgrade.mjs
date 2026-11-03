import { readActiveUpgrade,assertRetiredContinuation } from '../../operator/upgradeRecovery.mjs'
import { verifyRelease } from '../../operator/bootstrapPolicy.mjs'
import { readQualifiedTrialReport } from '../../operator/qualifiedRuntime.mjs'
import { inspectMaintenanceState } from '../../agent/runtimeMaintenance.mjs'
import { DatabaseSync } from 'node:sqlite'
import { existsSync,readFileSync } from 'node:fs'
import { safeUpgradeFailure } from '../../operator/upgradeDiagnostics.mjs'

const root='C:/ProgramData/TicketSimPilot'
let stage='read_upgrade_record'
async function main(){
const preboot=process.argv[2]==='preboot'
if(process.argv.length>3||process.argv[2]&&!preboot)throw new Error('UNKNOWN_INSPECTION_MODE')
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
  if(!preboot){
    const bootFile=`${root}/operator/m4-original-boot-20261103-001.json`
    if(existsSync(bootFile)){
      const boot=JSON.parse(readFileSync(bootFile,'utf8'))
      if(boot.status!=='verified'||boot.ownerId!==record.ownerId||boot.vmId!=='2b9c2170-9a23-4d08-b82e-29929afa4c10'||boot.checkpointId!=='e6d04330-142c-4397-8e0d-ddf5a9e69090')throw new Error('BOOT_NOT_INDEPENDENTLY_VERIFIED')
    }
    stage='read_actual_m3_host'
    const report=await readQualifiedTrialReport()
    if(report.livePass!==true||report.runId!=='76213ef3-ef9b-4bd2-9cb6-6c508dc2a92c'||report.b5LeaseExists)throw new Error('M3_NOT_VERIFIED')
  }
  // Preboot checks admission/state only. It never substitutes for the full
  // Running host + actual report gate required by ordinary continuation.
  process.stdout.write(`${JSON.stringify({eligible:true,phase:record.phase,releaseRoot:record.releaseRoot,ownerId:record.ownerId,livePass:preboot?null:true,purpose:preboot?'approved-boot-precheck':'runtime-continuation',readOnly:true})}\n`)
}finally{db.close()}
}
main().catch(error=>{
  // The old report CLI hides its cause. Never expose child stderr or a raw
  // execFileSync error dump; diagnose separately without starting services.
  process.stderr.write(`${JSON.stringify({eligible:false,readOnly:true,stage,failure:safeUpgradeFailure(error),continuationExists:existsSync(`${root}/operator/m4-retired-continuation.json`),noStart:true})}\n`)
  process.exitCode=1
})
