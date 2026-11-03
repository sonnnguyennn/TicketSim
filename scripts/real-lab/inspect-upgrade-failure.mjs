import { inspectUpgradeFailure } from '../../operator/upgradeDiagnostics.mjs'
import { readActualTrialReport } from '../../agent/trialReport.mjs'
import { inspectMaintenanceState } from '../../agent/runtimeMaintenance.mjs'

const stateRoot='C:/ProgramData/TicketSimPilot'
const report=await inspectUpgradeFailure({stateRoot,readReport:readActualTrialReport,
  inspectState:ownedMaintenanceId=>inspectMaintenanceState({agentPath:`${stateRoot}/agent/runs.sqlite`,operatorPath:`${stateRoot}/operator/actions.sqlite`,b5LeasePath:'E:/TicketSimOperatorState/b5/exclusive-lease',ownedMaintenanceId})})
process.stdout.write(`${JSON.stringify(report,null,2)}\n`)
