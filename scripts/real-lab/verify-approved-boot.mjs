// Read-only verification after the separately approved single boot.
import { readFileSync } from 'node:fs'
import { LiveOperations } from '../../agent/liveOperations.mjs'
import { checkVerdict,liveChecks } from '../../agent/livePolicy.mjs'
import { QUALIFIED_INSTALL,withQualifiedPowerShell,readQualifiedTrialReport } from '../../operator/qualifiedRuntime.mjs'
import { pathToFileURL } from 'node:url'
import { win32,resolve } from 'node:path'
import { safeUpgradeFailure } from '../../operator/upgradeDiagnostics.mjs'

export async function verifyApprovedBoot(){
  const report=await readQualifiedTrialReport()
  if(report.livePass!==true||report.runId!=='76213ef3-ef9b-4bd2-9cb6-6c508dc2a92c'||report.b5LeaseExists)throw new Error('M3_NOT_VERIFIED')
  const {runHostAction}=await import(pathToFileURL(win32.join(QUALIFIED_INSTALL,'operator/server.mjs')).href)
  const state='C:/ProgramData/TicketSimPilot'
  const approval=JSON.parse(readFileSync(`${state}/operator/approval.DRAFT.json`,'utf8').trim())
  const operations=new LiveOperations({hostBridge:{inspect:()=>withQualifiedPowerShell(()=>runHostAction('real-host-inspect-v1','e6d04330-142c-4397-8e0d-ddf5a9e69090'))},
    // This independent verifier runs under the Operator, not TicketSimAgent.
    // Use the original Operator key context; leave the Agent-owned shared
    // key/ACL and the actual non-admin runtime configuration unchanged.
    sshKeyPath:'E:/TicketSimOperatorState/b5/agent-key',knownHostsPath:'E:/TicketSimOperatorState/b1-20261029/ticketsim-lab-known-hosts',sshBinary:'C:/Windows/System32/OpenSSH/ssh.exe',keygenBinary:'C:/Windows/System32/OpenSSH/ssh-keygen.exe',sshConfig:'NUL'})
  const observation=await operations.observe('preflight',approval)
  const verdict=checkVerdict(observation.checks,liveChecks.preflight)
  return {readOnly:true,verified:verdict==='pass',livePass:report.livePass,runId:report.runId,vmId:report.vmId,checkpointId:report.checkpointId,checks:observation.checks}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  verifyApprovedBoot().then(result=>{process.stdout.write(`${JSON.stringify(result)}\n`);if(!result.verified)process.exitCode=1})
    .catch(error=>{process.stderr.write(`${JSON.stringify({readOnly:true,verified:false,failure:safeUpgradeFailure(error)})}\n`);process.exitCode=1})
}
