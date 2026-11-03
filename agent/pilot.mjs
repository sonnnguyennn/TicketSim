import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createAgentServer } from './server.mjs'
import { PairingManager } from './auth.mjs'
import { assertPilotIsolation } from './privilege.mjs'
import { LabStore } from './store.mjs'
import { WebPilot } from './webPilot.mjs'
import { TerminalService } from './terminalService.mjs'
import { LiveOperations } from './liveOperations.mjs'
import { LiveLabService } from './liveService.mjs'
import { OperatorBridge } from './operatorBridge.mjs'
import { assertLiveApproval } from './livePolicy.mjs'

const state='C:/ProgramData/TicketSimPilot'
const install='C:/Program Files/TicketSimPilot'
if(resolve(fileURLToPath(new URL('..',import.meta.url))).toLowerCase()!==resolve(install).toLowerCase())throw new Error('PILOT_MUST_RUN_FROM_PROTECTED_COPY')
const principal=assertPilotIsolation({pwsh:resolve(install,'powershell/pwsh.exe')})
const identity=JSON.parse(readFileSync(`${state}/agent/identity-evidence.json`,'utf8').trim())
if(identity.Pass!==true||identity.Principal.toLowerCase()!==principal.principal.toLowerCase())throw new Error('M1_AGENT_EVIDENCE_REQUIRED')
const terminalOnly=process.env.TICKETSIM_TERMINAL_ONLY!=='0'
const approval=assertLiveApproval(JSON.parse(readFileSync(`${state}/shared/${terminalOnly?'baseline':'approval'}.json`,'utf8').trim()),{readOnly:terminalOnly})
if(approval.checkpointId!=='e6d04330-142c-4397-8e0d-ddf5a9e69090')throw new Error('PILOT_CHECKPOINT_BINDING_MISMATCH')
if(existsSync('E:/TicketSimOperatorState/b5/exclusive-lease'))throw new Error('B5_LEASE_HELD')
const store=new LabStore(`${state}/agent/runs.sqlite`)
store.markInterruptedOnStartup()
const operations=new LiveOperations({hostBridge:new OperatorBridge({token:readFileSync(`${state}/shared/bridge-token`,'utf8').trim()}),sshKeyPath:`${state}/shared/agent-key`,knownHostsPath:`${state}/shared/known-hosts`,sshBinary:'C:/Windows/System32/OpenSSH/ssh.exe',keygenBinary:'C:/Windows/System32/OpenSSH/ssh-keygen.exe',sshConfig:'NUL'})
const pilot=new WebPilot({store,operations,approval,terminalOnly})
pilot.terminal=new TerminalService({assertScope:id=>pilot.assertTerminalScope(id)})
if(!terminalOnly)pilot.liveService=new LiveLabService(store,operations,approval,{closeTerminal:id=>pilot.terminal.closeRun(id)})
const auth=new PairingManager()
const publish=code=>writeFileSync(`${state}/agent/pairing-link.txt`,`https://127.0.0.1:4174/#pair=${code}\n`,{mode:0o600})
publish(auth.pairingCode)
const server=createAgentServer({auth,pilot,liveService:pilot.liveService,tls:{pfx:readFileSync(`${state}/shared/tls.pfx`),passphrase:readFileSync(`${state}/shared/tls-passphrase`,'utf8')},webRoot:resolve(install,'dist'),onPairingCode:publish})
const watchdog=setInterval(()=>pilot.liveService?.expireOverdue().catch(()=>{}),30_000)
watchdog.unref()
server.on('close',()=>{clearInterval(watchdog);pilot.terminal.close();store.close()})
server.listen(4174,'127.0.0.1',()=>{
  writeFileSync(`${state}/agent/runtime-evidence.json`,JSON.stringify({pid:process.pid,principal:principal.principal,privileged:principal.privileged,hypervReadable:principal.hypervReadable,terminalOnly,startedAt:new Date().toISOString()}))
  process.stdout.write(`TicketSim secure pilot ready: https://127.0.0.1:4174 (${terminalOnly?'terminal-only; fault disabled':'one approved trial'})\n`)
})
process.on('SIGINT',()=>server.close())
process.on('SIGTERM',()=>server.close())
