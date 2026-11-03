import { readActiveUpgrade,assertRetiredContinuation } from '../../operator/upgradeRecovery.mjs'
import { verifyRelease } from '../../operator/bootstrapPolicy.mjs'
import { readQualifiedTrialReport } from '../../operator/qualifiedRuntime.mjs'
import { inspectMaintenanceState } from '../../agent/runtimeMaintenance.mjs'
import { DatabaseSync } from 'node:sqlite'
import { existsSync,readFileSync } from 'node:fs'
import { safeUpgradeFailure } from '../../operator/upgradeDiagnostics.mjs'
import { assertBootContinuationEvidence,FIREWALL_REPAIR,FIREWALL_VERIFICATION } from '../../operator/bootRecovery.mjs'
import { verifyApprovedBoot } from './verify-approved-boot.mjs'

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
    let repairUsed=false
    const bootFile=`${root}/operator/m4-original-boot-20261103-001.json`
    if(existsSync(bootFile)){
      const repairFile=`${root}/operator/${FIREWALL_REPAIR}.json`
      const repairBytes=existsSync(repairFile)?readFileSync(repairFile):null
      const reconciliationFile=`${root}/operator/${FIREWALL_VERIFICATION}.json`
      const reconciliation=existsSync(reconciliationFile)?JSON.parse(readFileSync(reconciliationFile,'utf8')):null
      ;({repairUsed}=assertBootContinuationEvidence({bootBytes:readFileSync(bootFile),repairBytes,reconciliation,ownerId:record.ownerId}))
    }
    stage='read_actual_m3_host'
    if(repairUsed){
      stage='fresh_repaired_baseline'
      if(!(await verifyApprovedBoot()).verified)throw new Error('CURRENT_REPAIRED_BASELINE_NOT_PASS')
    }else{
      const report=await readQualifiedTrialReport()
      if(report.livePass!==true||report.runId!=='76213ef3-ef9b-4bd2-9cb6-6c508dc2a92c'||report.b5LeaseExists)throw new Error('M3_NOT_VERIFIED')
    }
  }
  // Preboot checks admission/state only. It never substitutes for the full
  // Running host + actual report gate required by ordinary continuation.
  process.stdout.write(`${JSON.stringify({eligible:true,phase:record.phase,releaseRoot:record.releaseRoot,ownerId:record.ownerId,livePass:preboot?null:true,purpose:preboot?'approved-boot-precheck':'runtime-continuation',readOnly:true})}\n`)
}finally{db.close()}
}
main().catch(error=>{
  // The old report CLI hides its cause. Never expose child stderr or a raw
  // execFileSync error dump; diagnose separately without starting services.
  process.stderr.write(`${JSON.stringify({eligible:false,readOnly:true,stage,verificationStage:error.verificationStage,jsonMetadata:error.jsonMetadata,failure:safeUpgradeFailure(error),continuationExists:existsSync(`${root}/operator/m4-retired-continuation.json`),noStart:true})}\n`)
  process.exitCode=1
})
