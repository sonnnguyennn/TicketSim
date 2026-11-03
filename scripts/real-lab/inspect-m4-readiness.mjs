import { listPlannedPacks } from '../../agent/scenarioPacks.mjs'
import { inspectMaintenanceState } from '../../agent/runtimeMaintenance.mjs'

// Source-only diagnostic; no install/start/stop or VM/SSH commands.
const root='C:/ProgramData/TicketSimPilot'
let runtime
try{
  runtime=inspectMaintenanceState({agentPath:`${root}/agent/runs.sqlite`,operatorPath:`${root}/operator/actions.sqlite`,b5LeasePath:'E:/TicketSimOperatorState/b5/exclusive-lease'})
}catch{
  runtime={inspectionOnly:true,mutationAuthorized:false,stateClear:false,blockers:['PROTECTED_STATE_NOT_READABLE_OR_NOT_VERIFIABLE']}
}
process.stdout.write(`${JSON.stringify({runtime,scenarioPacks:listPlannedPacks()},null,2)}\n`)
