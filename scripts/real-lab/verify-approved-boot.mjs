// Read-only verification after the separately approved single boot.
import { readFileSync } from 'node:fs'
import { LiveOperations } from '../../agent/liveOperations.mjs'
import { checkVerdict,liveChecks } from '../../agent/livePolicy.mjs'
import { readQualifiedTrialReport,readQualifiedHostInspection,parseQualifiedJson } from '../../operator/qualifiedRuntime.mjs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { safeUpgradeFailure } from '../../operator/upgradeDiagnostics.mjs'

export async function verifyApprovedBoot(){
  let verificationStage='qualified_trial_report'
  try{
  const report=await readQualifiedTrialReport()
  if(report.livePass!==true||report.runId!=='76213ef3-ef9b-4bd2-9cb6-6c508dc2a92c'||report.b5LeaseExists)throw new Error('M3_NOT_VERIFIED')
  const state='C:/ProgramData/TicketSimPilot'
  verificationStage='operator_draft_approval'
  const approval=parseQualifiedJson(readFileSync(`${state}/operator/approval.DRAFT.json`),'operator_draft_approval')
  verificationStage='qualified_host_inspect'
  const host=await readQualifiedHostInspection()
  verificationStage='guest_baseline_probes'
  const operations=new LiveOperations({hostBridge:{inspect:async()=>host},
    // This independent verifier runs under the Operator, not TicketSimAgent.
    // Use the original Operator key context; leave the Agent-owned shared
    // key/ACL and the actual non-admin runtime configuration unchanged.
    sshKeyPath:'E:/TicketSimOperatorState/b5/agent-key',knownHostsPath:'E:/TicketSimOperatorState/b1-20261029/ticketsim-lab-known-hosts',sshBinary:'C:/Windows/System32/OpenSSH/ssh.exe',keygenBinary:'C:/Windows/System32/OpenSSH/ssh-keygen.exe',sshConfig:'NUL'})
  const observation=await operations.observe('preflight',approval)
  const verdict=checkVerdict(observation.checks,liveChecks.preflight)
  return {readOnly:true,verified:verdict==='pass',livePass:report.livePass,runId:report.runId,vmId:report.vmId,checkpointId:report.checkpointId,checks:observation.checks}
  }catch(error){error.verificationStage??=verificationStage;throw error}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  verifyApprovedBoot().then(result=>{process.stdout.write(`${JSON.stringify(result)}\n`);if(!result.verified)process.exitCode=1})
    .catch(error=>{process.stderr.write(`${JSON.stringify({readOnly:true,verified:false,verificationStage:error.verificationStage,jsonMetadata:error.jsonMetadata,failure:safeUpgradeFailure(error)})}\n`);process.exitCode=1})
}
