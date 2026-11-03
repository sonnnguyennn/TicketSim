import { afterEach,expect,it } from 'vitest'
import https from 'node:https'
import { readFileSync } from 'node:fs'
import { RunControlJournal } from './runControl.mjs'
import { OperatorApprovalControl } from './approvalControl.mjs'
import { createOperatorControlServer } from './controlServer.mjs'

const tls={cert:readFileSync(new URL('../tests/fixtures/web-pilot-test.crt',import.meta.url)),key:readFileSync(new URL('../tests/fixtures/web-pilot-test.key',import.meta.url))}
const cleanups=[]
afterEach(async()=>{for(const cleanup of cleanups.splice(0).reverse())await cleanup()})
async function setup({qualified=true,reopen=false,now=()=>Date.now()}={}){
  const journal=new RunControlJournal(':memory:')
  cleanups.push(()=>journal.close())
  const control=new OperatorApprovalControl({journal,principal:'SONNGUYEN\\Admin',pairingCode:'separate-operator-test-code',resolveRelease:scenarioId=>({qualified,scenarioId,revision:1,bundleSha256:'a'.repeat(64)}),inspectLegacy:()=>({stateClear:true,mutationAuthorized:false}),now})
  let published=null
  const reopenToken='test-only-operator-recovery-capability-123456789'
  const server=createOperatorControlServer({control,tls,...(reopen?{reopenToken,onPairingReissued:code=>{published=code}}:{})})
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
  cleanups.push(()=>new Promise(resolve=>server.close(resolve)))
  const port=server.address().port,origin=`https://127.0.0.1:${port}`
  function request(path,{data={},cookie,csrf,method='POST',headers={}}={}){
    return new Promise((resolve,reject)=>{
      const request=https.request({hostname:'127.0.0.1',port,path,method,rejectUnauthorized:false,headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...(csrf?{'X-TicketSim-Operator-CSRF':csrf}:{}),...headers}},response=>{
        const chunks=[];response.on('data',chunk=>chunks.push(chunk));response.on('end',()=>{const raw=Buffer.concat(chunks).toString();resolve({status:response.statusCode,headers:response.headers,raw,json:()=>JSON.parse(raw)})})
      });request.on('error',reject);request.end(method==='GET'?undefined:JSON.stringify(data))
    })
  }
  async function pair(){const response=await request('/api/operator/pair',{data:{code:'separate-operator-test-code'}});return {cookie:response.headers['set-cookie'][0].split(';')[0],csrf:response.json().csrf,response}}
  return {request,pair,journal,reopenToken,published:()=>published}
}

it('serves a restrictive Operator page and issues only a scoped grant over its own HTTPS session',async()=>{
  const {request,pair,journal}=await setup()
  const page=await request('/',{method:'GET'})
  expect(page.status).toBe(200);expect(page.headers['content-security-policy']).toContain("frame-ancestors 'none'")
  expect(page.raw).toContain('Xác thực Operator');expect(page.raw).not.toContain('__TICKETSIM_NONCE__')
  const session=await pair()
  expect(session.response.headers['set-cookie'][0]).toContain('HttpOnly; SameSite=Strict')
  expect(session.response.raw).not.toContain('token')
  const proposal=await request('/api/operator/proposal',{...session,data:{scenarioId:'LAB-TLAB-002'}})
  expect(proposal.status).toBe(200)
  expect(proposal.json().effects).toContain('set only the authored training index file mode to 000')
  const approved=await request('/api/operator/approve',{...session,data:{proposalId:proposal.json().proposalId,consent:proposal.json().consent}})
  expect(approved.status).toBe(201)
  expect(journal.get(approved.json().approvalId).status).toBe('issued')
  expect(journal.db.prepare('SELECT COUNT(*) n FROM control_attempts').get().n).toBe(0)
})

it('denies foreign Host/Origin, learner credentials, duplicate cookies, missing CSRF and arbitrary inputs',async()=>{
  const {request,pair}=await setup()
  expect((await request('/',{method:'GET',headers:{Host:'attacker.example'}})).status).toBe(403)
  expect((await request('/api/operator/pair',{headers:{Origin:'https://attacker.example'},data:{code:'separate-operator-test-code'}})).status).toBe(403)
  expect((await request('/api/operator/catalog',{cookie:'__Host-ticketsim=learner',headers:{Authorization:'Bearer bridge-token'}})).status).toBe(401)
  const session=await pair()
  expect((await request('/api/operator/catalog',{cookie:session.cookie})).json().code).toBe('OPERATOR_CSRF_REQUIRED')
  expect((await request('/api/operator/catalog',{...session,cookie:session.cookie+'; '+session.cookie})).status).toBe(401)
  expect((await request('/api/operator/proposal',{...session,data:{scenarioId:'LAB-TLAB-002',script:'sudo bash'}})).json().code).toBe('INVALID_REQUEST')
  for(const path of ['/api/operator/reset','/api/operator/execute','/api/operator/maintenance'])expect((await request(path,session)).status).toBe(404)
})

it('shows unqualified packs unavailable and refuses plaintext server configuration',async()=>{
  const {request,pair,journal}=await setup({qualified:false}),session=await pair()
  const catalog=(await request('/api/operator/catalog',session)).json()
  expect(catalog.scenarios.every(entry=>entry.availableForApproval===false)).toBe(true)
  expect((await request('/api/operator/proposal',{...session,data:{scenarioId:'LAB-TLAB-002'}})).json().code).toBe('SCENARIO_RELEASE_NOT_QUALIFIED')
  expect(journal.db.prepare('SELECT COUNT(*) n FROM control_grants').get().n).toBe(0)
  expect(()=>createOperatorControlServer({control:{}})).toThrow('OPERATOR_HTTPS_CONFIGURATION_REQUIRED')
})

it('allows only the protected launcher capability to reissue expired pairing without publishing secrets in HTTP',async()=>{
  let now=0
  const {request,pair,reopenToken,published}=await setup({reopen:true,now:()=>now})
  const session=await pair()
  expect((await request('/api/operator/reissue',session)).status).toBe(403)
  expect((await request('/api/operator/reissue',{headers:{Authorization:`Bearer ${reopenToken}`}})).json().code).toBe('SESSION_STILL_ACTIVE')
  now=6*60_000
  const response=await request('/api/operator/reissue',{headers:{Authorization:`Bearer ${reopenToken}`}})
  expect(response.json()).toEqual({published:true});expect(published()).toMatch(/^[A-Za-z0-9_-]{32}$/)
  expect(response.raw).not.toContain(published())
  expect((await request('/api/operator/pair',{data:{code:published()}})).status).toBe(200)
})

it('rejects weak recovery capabilities rather than starting a weakly protected launcher route',()=>{
  expect(()=>createOperatorControlServer({control:{},tls,reopenToken:'weak',onPairingReissued:()=>{}})).toThrow('OPERATOR_REOPEN_CONFIGURATION_INVALID')
})
