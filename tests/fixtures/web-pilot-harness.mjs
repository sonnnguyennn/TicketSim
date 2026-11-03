// Loopback-only browser integration harness. Never contacts Hyper-V or the actual guest.
import { readFileSync } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import ssh2 from 'ssh2'
import { createAgentServer } from '../../agent/server.mjs'
import { LabStore } from '../../agent/store.mjs'
import { PairingManager } from '../../agent/auth.mjs'
import { TerminalService, openGuestPty } from '../../agent/terminalService.mjs'
import { WebPilot } from '../../agent/webPilot.mjs'
import { LIVE_TARGET, liveChecks } from '../../agent/livePolicy.mjs'
const { Server, Client, utils }=ssh2

const hostKey=utils.generateKeyPairSync('ed25519')
const fingerprint=`SHA256:${createHash('sha256').update(utils.parseKey(hostKey.private).getPublicSSH()).digest('base64').replace(/=+$/,'')}`
const ssh=new Server({hostKeys:[hostKey.private]},client=>{
  client.on('error',()=>{})
  client.on('authentication',ctx=>ctx.method==='password'&&ctx.username==='lab'&&ctx.password==='browser-fixture-password'?ctx.accept():ctx.reject())
  client.on('ready',()=>client.on('session',accept=>{
    const session=accept()
    session.on('pty',accept=>accept())
    session.on('window-change',accept=>accept?.())
    session.on('shell',accept=>{const channel=accept();channel.write('TRANSPORT TEST HARNESS — not actual VM\r\nTiếng Việt · Ubuntu PTY fixture\r\n');channel.on('data',chunk=>channel.write(chunk))})
  }))
})
await new Promise(resolve=>ssh.listen(0,'127.0.0.1',resolve))
const store=new LabStore(':memory:')
const approval={checkpointId:'e6d04330-142c-4397-8e0d-ddf5a9e69090'}
const operations={async observe(stage){return {vmId:LIVE_TARGET.vmId,checkpointId:approval.checkpointId,recoveryVmId:LIVE_TARGET.recoveryVmId,protectedVmId:LIVE_TARGET.protectedVmId,checks:Object.fromEntries(liveChecks[stage].map(id=>[id,'pass']))}},async website(){return {status:200,contentMatches:true,preview:'TicketSim browser fixture page\n',checkedAt:new Date().toISOString(),verdict:'pass'}}}
const pilot=new WebPilot({store,operations,approval,terminalOnly:false})
pilot.terminal=new TerminalService({assertScope:id=>pilot.assertTerminalScope(id),connect:password=>openGuestPty(password,{fingerprint,makeClient:()=>{
  const client=new Client(),connect=client.connect.bind(client)
  client.connect=options=>connect({...options,host:'127.0.0.1',port:ssh.address().port})
  return client
}})})
pilot.liveService={
  async start(_scenario,key){
    const id=randomUUID()
    store.createRun({runId:id,scenarioId:'LAB-WEB-001',scenarioVersion:2,target:LIVE_TARGET,requestKey:key,at:new Date().toISOString(),mode:'real'})
    for(const [from,to] of [['preflight','baseline_ready'],['baseline_ready','injecting'],['injecting','ready'],['ready','running']])store.transition(id,from,to,'test_harness',{simulated:false})
    return store.getRun(id)
  },
  async submit(id,key,note){
    store.reserveSubmission(id,key,new Date().toISOString(),note)
    store.transition(id,'running','submitting','test_harness',{simulated:false})
    await pilot.terminal.closeRun(id)
    store.appendEvent(id,'grade_check',{simulated:false,checkId:'real-http-status-v1',outcome:'pass'})
    store.transition(id,'submitting','graded','test_harness',{simulated:false},{gradeStatus:'pass'})
    store.transition(id,'graded','restoring','test_harness',{simulated:false},{recoveryStatus:'in_progress'})
    store.appendEvent(id,'baseline_checked',{simulated:false,checkId:'real-web-baseline-v1',outcome:'pass'})
    store.transition(id,'restoring','verified_clean','test_harness',{simulated:false},{recoveryStatus:'verified'})
    return store.finish(id)
  },
}
const server=createAgentServer({auth:new PairingManager({pairingCode:'browser-fixture-pair'}),pilot,liveService:pilot.liveService,tls:{key:readFileSync(new URL('./web-pilot-test.key',import.meta.url)),cert:readFileSync(new URL('./web-pilot-test.crt',import.meta.url))},webRoot:new URL('../../dist/',import.meta.url).pathname.replace(/^\/(\w:)/,'$1')})
server.listen(4188,'127.0.0.1',()=>process.stdout.write('Browser harness ready\n'))
