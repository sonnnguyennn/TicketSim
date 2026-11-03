import { inspectUpgradeFailure,probeStagedHost } from '../../operator/upgradeDiagnostics.mjs'
import { readActualTrialReport } from '../../agent/trialReport.mjs'
import { inspectMaintenanceState } from '../../agent/runtimeMaintenance.mjs'
import { verifyRelease } from '../../operator/bootstrapPolicy.mjs'
import { readActiveUpgrade } from '../../operator/upgradeRecovery.mjs'

const stateRoot='C:/ProgramData/TicketSimPilot'
const stagedOnly=process.argv[2]==='staged-host'
const report=await inspectUpgradeFailure({stateRoot,readReport:stagedOnly?null:readActualTrialReport,
  inspectState:ownedMaintenanceId=>inspectMaintenanceState({agentPath:`${stateRoot}/agent/runs.sqlite`,operatorPath:`${stateRoot}/operator/actions.sqlite`,b5LeasePath:'E:/TicketSimOperatorState/b5/exclusive-lease',ownedMaintenanceId})})
if(stagedOnly){
  // This flag diagnoses the original failed clone, even after an explicit
  // resumed release has switched management back to the qualified runtime.
  const {original:record}=readActiveUpgrade(stateRoot)
  verifyRelease(record.releaseRoot,record.manifestSha256)
  report.stagedHost=await probeStagedHost(record)
}
process.stdout.write(`${JSON.stringify(report,null,2)}\n`)
