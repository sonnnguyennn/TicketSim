import { afterEach, expect, it } from 'vitest'
import { once } from 'node:events'
import https from 'node:https'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import ssh2 from 'ssh2'
import { WebSocket } from 'ws'
import { PairingManager } from './auth.mjs'
import { LabStore } from './store.mjs'
import { WebPilot } from './webPilot.mjs'
import { TerminalService, openGuestPty, verifyGuestKey } from './terminalService.mjs'
import { createAgentServer } from './server.mjs'
import { LIVE_TARGET, liveChecks } from './livePolicy.mjs'
const { Server: SshServer, Client, utils }=ssh2

const cert=readFileSync(new URL('../tests/fixtures/web-pilot-test.crt',import.meta.url))
const key=readFileSync(new URL('../tests/fixtures/web-pilot-test.key',import.meta.url))
const cleanups=[]
afterEach(async()=>{for(const cleanup of cleanups.splice(0).reverse())await cleanup()})
const db=()=>{const store=new LabStore(':memory:');cleanups.push(()=>store.close());return store}

it('renews the same owner beyond a 25-minute lab, enforces absolute expiry and permits explicit reauthentication',()=>{
  let now=0
  const auth=new PairingManager({pairingCode:'fixture-pair',now:()=>now})
  const {token}=auth.pair('fixture-pair'),header=`Bearer ${token}`,owner=auth.authorize(header).owner
  for(let minute=10;minute<=110;minute+=10){now=minute*60_000;auth.renew(header);expect(auth.authorize(header).owner).toBe(owner)}
  now=119*60_000;expect(Date.parse(auth.renew(header).expiresAt)).toBe(120*60_000)
  now=120*60_000;expect(()=>auth.authorize(header)).toThrow('UNAUTHORIZED')
  const code=auth.reissuePairing();const next=auth.pair(code)
  expect(auth.authorize(`Bearer ${next.token}`).owner).not.toBe(owner)
  expect(()=>auth.authorize(header)).toThrow('UNAUTHORIZED')
})

it('persists pending operations and note drafts, and never replays an uncertain operation after restart',()=>{
  const store=db()
  const accepted=store.acceptOperation('stable_start_key_001','start')
  expect(accepted.operation.status).toBe('pending')
  expect(store.acceptOperation('stable_start_key_001','start').duplicate).toBe(true)
  store.markInterruptedOnStartup()
  expect(store.getOperation('stable_start_key_001').status).toBe('unknown')
  expect(()=>store.acceptOperation('another_start_key_002','start')).toThrow('OPERATION_REQUIRES_REVIEW')
  expect(()=>store.acceptOperation('stable_start_key_001','submit','x')).toThrow('IDEMPOTENCY_KEY_REUSED')
})

it('terminal-only mode cannot claim a trial or accept arbitrary target parameters',async()=>{
  const store=db(),pilot=new WebPilot({store,terminalOnly:true})
  expect(()=>pilot.start('stable_start_key_001','owner')).toThrow('TRIAL_NOT_ARMED')
  await expect(pilot.assertTerminalScope(null)).rejects.toThrow('FRESH_PREFLIGHT_REQUIRED')
  expect(store.listRuns()).toHaveLength(0)
  pilot.lastPreflight={verdict:'pass',checkedAt:new Date().toISOString()}
  store.acceptOperation('preview_race_start_001','start')
  await expect(pilot.assertTerminalScope(null)).rejects.toThrow('OPERATION_REQUIRES_REVIEW')
})

it('autosaves the same learner note durably and rejects changes after the submission boundary',()=>{
  const store=db(),id='00000000-0000-4000-8000-000000000010'
  store.createRun({runId:id,scenarioId:'LAB-WEB-001',scenarioVersion:2,target:LIVE_TARGET,requestKey:'note_fixture_start_001',at:new Date().toISOString(),mode:'real'})
  for(const [from,to] of [['preflight','baseline_ready'],['baseline_ready','injecting'],['injecting','ready'],['ready','running']])store.transition(id,from,to,'fixture_transition',{simulated:false})
  store.saveNote(id,'Learner verification from browser')
  expect(store.getRun(id).evidence_note).toBe('Learner verification from browser')
  store.transition(id,'running','submitting','fixture_submit',{simulated:false})
  expect(()=>store.saveNote(id,'late edit')).toThrow('RUN_NOT_SUBMITTABLE')
  expect(store.getRun(id).evidence_note).toBe('Learner verification from browser')
})

async function fixture(){
  const hostKey=utils.generateKeyPairSync('ed25519')
  const fingerprint=`SHA256:${createHash('sha256').update(utils.parseKey(hostKey.private).getPublicSSH()).digest('base64').replace(/=+$/,'')}`
  const inputs=[],windows=[],clients=new Set()
  const ssh=new SshServer({hostKeys:[hostKey.private]},client=>{
    clients.add(client);client.on('error',()=>{});client.on('close',()=>clients.delete(client))
    client.on('authentication',ctx=>ctx.method==='password'&&ctx.username==='lab'&&ctx.password==='fixture-only-password'?ctx.accept():ctx.reject())
    client.on('ready',()=>client.on('session',accept=>{
      const session=accept()
      session.on('pty',(accept,_reject,info)=>{windows.push(info);accept()})
      session.on('window-change',(accept,_reject,info)=>{windows.push(info);accept?.()})
      session.on('shell',accept=>{
        const channel=accept();channel.write('Fixture PTY · Tiếng Việt\r\n')
        channel.on('data',chunk=>{inputs.push(chunk.toString());channel.write(chunk)})
        channel.on('close',()=>channel.end())
      })
    }))
  })
  await new Promise(resolve=>ssh.listen(0,'127.0.0.1',resolve))
  cleanups.push(async()=>{for(const client of clients)client.end();await new Promise(resolve=>ssh.close(resolve))})
  const connect=password=>openGuestPty(password,{fingerprint,makeClient:()=>{
    const client=new Client(),original=client.connect.bind(client)
    client.connect=options=>original({...options,host:'127.0.0.1',port:ssh.address().port})
    return client
  }})
  const store=db()
  const approval={checkpointId:'e6d04330-142c-4397-8e0d-ddf5a9e69090'}
  const operations={async observe(stage){return {vmId:LIVE_TARGET.vmId,checkpointId:approval.checkpointId,recoveryVmId:LIVE_TARGET.recoveryVmId,protectedVmId:LIVE_TARGET.protectedVmId,checks:Object.fromEntries(liveChecks[stage].map(id=>[id,'pass']))}},async website(){return {status:200,contentMatches:true,preview:'<script>untrusted</script>'}}}
  const pilot=new WebPilot({store,operations,approval,terminalOnly:true})
  pilot.terminal=new TerminalService({connect,assertScope:id=>pilot.assertTerminalScope(id)})
  const auth=new PairingManager({pairingCode:'fixture-pair'})
  const server=createAgentServer({tls:{cert,key},pilot,auth})
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
  cleanups.push(async()=>{pilot.terminal.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve))})
  const origin=`https://127.0.0.1:${server.address().port}`
  let cookie='',csrf=''
  const request=(path,body,headers={})=>new Promise((resolve,reject)=>{
    const req=https.request(`${origin}/api/v1${path}`,{ca:cert,method:body===undefined?'GET':'POST',headers:{Origin:origin,...(body===undefined?{}:{'Content-Type':'application/json'}),Cookie:cookie,'X-TicketSim-CSRF':csrf,...headers}},res=>{
      let text='';res.on('data',chunk=>{text+=chunk});res.on('end',()=>{
        if(res.headers['set-cookie'])cookie=res.headers['set-cookie'][0].split(';')[0]
        const data=JSON.parse(text);if(data.csrf)csrf=data.csrf
        resolve({status:res.statusCode,data,headers:res.headers})
      })
    });req.on('error',reject);if(body!==undefined)req.write(JSON.stringify(body));req.end()
  })
  await request('/pair',{code:'fixture-pair'})
  return {pilot,request,origin,inputs,windows,auth,store,connect,ws:()=>new WebSocket(`${origin.replace('https:','wss:')}/api/v1/web/terminal/${pilot.terminal.current(auth.session.owner).id}`,{ca:cert,headers:{Origin:origin,Cookie:cookie}})}
}

it('uses authenticated HTTPS cookies/CSRF and rejects insecure or foreign terminal upgrades',async()=>{
  const f=await fixture()
  const session=await f.request('/session')
  expect(session.status).toBe(200)
  expect((await f.request('/web/preflight',{}, {'X-TicketSim-CSRF':''})).status).toBe(403)
  expect((await f.request('/web/preflight',{})).data.verdict).toBe('pass')
  expect((await f.request('/web/terminal',{runId:null,password:'fixture-only-password',host:'other'})).status).toBe(400)
  expect((await f.request('/web/terminal',{runId:null,password:'wrong'})).status).toBe(401)
  expect((await f.request('/web/terminal',{runId:null,password:'fixture-only-password'})).status).toBe(200)
  const bad=new WebSocket(`${f.origin.replace('https:','wss:')}/api/v1/web/terminal/${f.pilot.terminal.current(f.auth.session.owner).id}`,{ca:cert,headers:{Origin:'https://foreign.invalid'}})
  bad.on('error',()=>{})
  const [response]=await new Promise(resolve=>bad.once('unexpected-response',(_req,res)=>{res.resume();resolve([res]);bad.terminate()}))
  expect(response.statusCode).toBe(403)
  expect(f.store.db.prepare('SELECT COUNT(*) AS n FROM lab_runs').get().n).toBe(0)
})

it('carries real SSH PTY bytes, Ctrl+C, resize and UTF-8 over WSS; refresh and reconnect preserve the session; freeze revokes input',async()=>{
  const f=await fixture();await f.request('/web/preflight',{})
  await f.request('/web/terminal',{runId:null,password:'fixture-only-password'})
  const first=f.ws();const greeting=once(first,'message');await once(first,'open')
  expect((await greeting)[0].toString()).toContain('Tiếng Việt')
  const echoed=once(first,'message');first.send(JSON.stringify({type:'input',data:'đọc dữ liệu\u0003'}))
  expect((await echoed)[0].toString()).toContain('đọc dữ liệu\u0003')
  first.send(JSON.stringify({type:'resize',rows:32,cols:100}))
  await new Promise(resolve=>setTimeout(resolve,50));expect(f.windows.some(w=>w.rows===32&&w.cols===100)).toBe(true)
  const before=(await f.request('/web/state')).data.terminal.id
  expect((await f.request('/session')).status).toBe(200)
  first.close();await once(first,'close')
  const second=f.ws();const replay=once(second,'message');await once(second,'open');await replay
  expect((await f.request('/web/state')).data.terminal.id).toBe(before)
  const rejected=f.ws();rejected.on('error',()=>{})
  const response=await new Promise(resolve=>rejected.once('unexpected-response',(_req,res)=>{res.resume();resolve(res.statusCode);rejected.terminate()}))
  expect(response).toBe(403)
  await f.pilot.terminal.closeRun(null)
  expect(f.pilot.terminal.current(f.auth.session.owner)).toBeNull()
  expect(f.inputs).toEqual(['đọc dữ liệu\u0003'])
  expect(JSON.stringify(f.store.db.prepare('SELECT * FROM lab_events').all())).not.toContain('fixture-only-password')
})

it('rejects wrong host fingerprints before opening a learner shell',()=>{
  expect(verifyGuestKey(Buffer.from('wrong key'))).toBe(false)
})
