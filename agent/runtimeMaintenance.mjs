import { existsSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

// Inspection only: no authorization to stop, refresh, edit leases or replay work.
// A future maintenance executor must also quiesce admission and recheck under
// exclusive ownership; this point-in-time snapshot cannot remove that race.
export function inspectMaintenanceState({agentPath,operatorPath,b5LeasePath}){
  if(![agentPath,operatorPath,b5LeasePath].every(path=>typeof path==='string'&&path.length))throw new Error('MAINTENANCE_PATHS_REQUIRED')
  if(!existsSync(agentPath)||!existsSync(operatorPath))throw new Error('MAINTENANCE_DATABASE_MISSING')
  let agent,operator
  try{
    agent=new DatabaseSync(agentPath,{readOnly:true})
    operator=new DatabaseSync(operatorPath,{readOnly:true})
    agent.exec('PRAGMA query_only=ON; BEGIN')
    operator.exec('PRAGMA query_only=ON; BEGIN')
    if(agent.prepare('PRAGMA user_version').get().user_version!==4)throw new Error('MAINTENANCE_DATABASE_VERSION_UNSUPPORTED')
    const leases=agent.prepare('SELECT vm_ref,run_id,lease_state FROM vm_leases').all()
    const runs=agent.prepare("SELECT run_id,phase,recovery_status,completed_at FROM lab_runs WHERE mode='real'").all()
    const operations=agent.prepare('SELECT request_key,status FROM web_operations').all()
    const claims=operator.prepare('SELECT approval_id,run_id,finalized_at FROM approvals').all()
    const actions=operator.prepare('SELECT action_id,approval_id,run_id,operation_id,status FROM actions').all()
    const blockers=[]
    if(existsSync(b5LeasePath))blockers.push('B5_LEASE_HELD')
    if(leases.length)blockers.push('VM_LEASE_HELD')
    if(runs.some(run=>run.phase!=='completed'||run.recovery_status!=='verified'||!run.completed_at))blockers.push('REAL_RUN_NOT_VERIFIED_COMPLETE')
    if(operations.some(operation=>!['done','failed'].includes(operation.status)))blockers.push('OPERATION_UNRESOLVED')
    if(claims.some(claim=>!claim.finalized_at||!runs.some(run=>run.run_id===claim.run_id)))blockers.push('OPERATOR_CLAIM_UNRESOLVED')
    if(actions.some(action=>action.status!=='pass'||!claims.some(claim=>claim.approval_id===action.approval_id&&claim.run_id===action.run_id)))blockers.push('OPERATOR_ACTION_UNRESOLVED')
    if(runs.some(run=>!claims.some(claim=>claim.run_id===run.run_id&&claim.finalized_at)))blockers.push('REAL_RUN_NOT_FINALIZED')
    if(claims.some(claim=>actions.filter(action=>action.approval_id===claim.approval_id&&action.run_id===claim.run_id&&action.operation_id==='real-host-reset-v1'&&action.status==='pass').length!==1))blockers.push('RESET_EVIDENCE_NOT_VERIFIED')
    return {checkedAt:new Date().toISOString(),inspectionOnly:true,mutationAuthorized:false,
      stateClear:blockers.length===0,blockers,completedRealRuns:runs.filter(run=>run.phase==='completed').length,
      preservedApprovalIds:claims.map(claim=>claim.approval_id)}
  }finally{operator?.close();agent?.close()}
}
