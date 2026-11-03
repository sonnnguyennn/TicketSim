import { readFileSync,writeFileSync,realpathSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { verifyRelease,assertOperatorToken } from './bootstrapPolicy.mjs'
import { readActiveUpgrade } from './upgradeRecovery.mjs'
import { QUALIFIED_PWSH,withQualifiedPowerShell } from './qualifiedRuntime.mjs'

const state='C:/ProgramData/TicketSimPilot'
const root=resolve(fileURLToPath(new URL('..',import.meta.url)))
if(process.platform!=='win32'||!/^C:\\Program Files\\TicketSimPilot\\releases\\[0-9a-f-]{36}$/i.test(root)||realpathSync(process.execPath).toLowerCase()!==resolve(root,'node.exe').toLowerCase())throw new Error('PROTECTED_OPERATOR_BOOTSTRAP_REQUIRED')
const {record}=readActiveUpgrade(state)
if(resolve(record.releaseRoot)!==root||!['retired','installed'].includes(record.phase))throw new Error('PROTECTED_OPERATOR_BOOTSTRAP_REQUIRED')
verifyRelease(root,record.manifestSha256)
const identity=assertOperatorToken(JSON.parse(await withQualifiedPowerShell(()=>execFileSync(QUALIFIED_PWSH,['-NoProfile','-NonInteractive','-File',resolve(root,'scripts/real-lab/Get-OperatorToken.ps1')],{encoding:'utf8',windowsHide:true,timeout:15_000}))),record.operatorPrincipal)
const { RunControlJournal }=await import('./runControl.mjs')
const { OperatorApprovalControl }=await import('./approvalControl.mjs')
const { createOperatorControlServer }=await import('./controlServer.mjs')
const { inspectMaintenanceState }=await import('../agent/runtimeMaintenance.mjs')
const journal=new RunControlJournal(`${state}/operator/actions.sqlite`)
const gate=journal.db.prepare('SELECT * FROM control_gate').get()
if(record.phase==='retired'?(gate?.kind!=='maintenance'||gate.owner_id!==record.ownerId):!!gate)throw new Error('UPGRADE_MAINTENANCE_OWNER_MISMATCH')
const control=new OperatorApprovalControl({journal,principal:identity.Principal,
  // No new pack is qualified. Only a future reviewed release can change this.
  resolveRelease:()=>null,
  inspectLegacy:()=>inspectMaintenanceState({agentPath:`${state}/agent/runs.sqlite`,operatorPath:`${state}/operator/actions.sqlite`,b5LeasePath:'E:/TicketSimOperatorState/b5/exclusive-lease'})})
const publish=code=>writeFileSync(`${state}/operator/control-pairing-link.txt`,`https://127.0.0.1:4176/#pair=${code}\n`)
const reopenToken=randomBytes(32).toString('base64url')
const server=createOperatorControlServer({control,tls:{pfx:readFileSync(`${state}/shared/tls.pfx`),passphrase:readFileSync(`${state}/shared/tls-passphrase`,'utf8')},reopenToken,onPairingReissued:publish})
server.on('error',()=>{process.stderr.write('OPERATOR_CONTROL_START_FAILED: maintenance gate retained\n');process.exitCode=1;journal.close()})
server.on('close',()=>journal.close())
server.listen(4176,'127.0.0.1',()=>{
  // Parent directory is Operator-only. Never print the pairing URL or token.
  publish(control.auth.pairingCode)
  writeFileSync(`${state}/operator/control-reopen-token`,reopenToken)
  writeFileSync(`${state}/operator/control-runtime.json`,JSON.stringify({pid:process.pid,principal:identity.Principal,sid:identity.Sid,releaseRoot:root,startedAt:new Date().toISOString(),approvalOnly:true,qualifiedPacks:0}))
  process.stdout.write('Operator consent page ready on verified loopback HTTPS; all new packs remain unavailable.\n')
})
process.on('SIGINT',()=>server.close())
process.on('SIGTERM',()=>server.close())
