// Additional read-only precheck for the single approved incident repair.
import { readFileSync,existsSync } from 'node:fs'
import { readActiveUpgrade } from '../../operator/upgradeRecovery.mjs'
import { readQualifiedTrialReport } from '../../operator/qualifiedRuntime.mjs'
import { BOOT_REQUEST,FIREWALL_REPAIR,BOOT_CHECKPOINT,bootEvidenceHash } from '../../operator/bootRecovery.mjs'
import { safeUpgradeFailure } from '../../operator/upgradeDiagnostics.mjs'

async function main(){
  const state='C:/ProgramData/TicketSimPilot'
  const {record}=readActiveUpgrade(state)
  if(existsSync(`${state}/operator/${FIREWALL_REPAIR}.json`))throw new Error('REPAIR_ALREADY_RESERVED_DO_NOT_RETRY')
  const bytes=readFileSync(`${state}/operator/${BOOT_REQUEST}.json`),boot=JSON.parse(bytes.toString('utf8'))
  if(boot.status!=='failed-quarantined'||boot.requestId!==BOOT_REQUEST||boot.ownerId!==record.ownerId||boot.vmId!=='2b9c2170-9a23-4d08-b82e-29929afa4c10'||boot.checkpointId!==BOOT_CHECKPOINT)throw new Error('FAILED_BOOT_BINDING_MISMATCH')
  const report=await readQualifiedTrialReport()
  if(report.livePass!==true||report.runId!=='76213ef3-ef9b-4bd2-9cb6-6c508dc2a92c'||report.b5LeaseExists)throw new Error('M3_HOST_NOT_VERIFIED')
  process.stdout.write(`${JSON.stringify({readOnly:true,eligible:true,ownerId:record.ownerId,failedBootSha256:bootEvidenceHash(bytes),vmId:boot.vmId,checkpointId:boot.checkpointId})}\n`)
}
main().catch(error=>{process.stderr.write(`${JSON.stringify({eligible:false,readOnly:true,failure:safeUpgradeFailure(error)})}\n`);process.exitCode=1})
