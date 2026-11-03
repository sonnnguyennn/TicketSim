import https from 'node:https'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'

const page=readFileSync(new URL('./operatorPage.html',import.meta.url),'utf8')
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===[...keys].sort().join(',')
async function body(request){
  if(request.headers['content-type']!=='application/json')throw new Error('JSON_REQUIRED')
  const chunks=[];let size=0
  for await(const chunk of request){size+=chunk.length;if(size>2048)throw new Error('BODY_TOO_LARGE');chunks.push(chunk)}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw new Error('INVALID_JSON')}
}
const unauthorized=new Set(['UNAUTHORIZED','PAIRING_DENIED'])

/** Factory only. Not mounted in the installed pilot and never starts a listener
 * on import. Bootstrap must verify the real Operator identity and supply its
 * protected TLS, journal, independent pairing code and release resolver.
 * There are deliberately no execution, reset, maintenance or script routes.
 */
export function createOperatorControlServer({control,tls}={}){
  if(!control||!tls||!(tls.pfx||tls.key&&tls.cert))throw new Error('OPERATOR_HTTPS_CONFIGURATION_REQUIRED')
  const server=https.createServer(tls,async(request,response)=>{
    const origin=`https://127.0.0.1:${request.socket.localPort}`
    const send=(status,value)=>{response.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});response.end(JSON.stringify(value))}
    response.setHeader('Cache-Control','no-store')
    response.setHeader('X-Content-Type-Options','nosniff')
    response.setHeader('Referrer-Policy','no-referrer')
    try{
      if(request.socket.remoteAddress!=='127.0.0.1'||request.headers.host!==`127.0.0.1:${request.socket.localPort}`||!request.socket.encrypted)return send(403,{code:'FORBIDDEN'})
      if(request.method==='GET'&&request.url==='/'){
        const nonce=randomBytes(24).toString('base64url')
        response.setHeader('Content-Security-Policy',`default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`)
        response.writeHead(200,{'Content-Type':'text/html; charset=utf-8'})
        return response.end(page.replaceAll('__TICKETSIM_NONCE__',nonce))
      }
      if(request.method!=='POST'||request.headers.origin!==origin)return send(403,{code:'FORBIDDEN'})
      const paths=['/api/operator/pair','/api/operator/session','/api/operator/catalog','/api/operator/proposal','/api/operator/approve']
      if(!paths.includes(request.url))return send(404,{code:'NOT_FOUND'})
      const input=await body(request)
      if(request.url==='/api/operator/pair'){
        if(!exact(input,['code']))throw new Error('INVALID_REQUEST')
        const paired=control.auth.pair(input.code)
        response.setHeader('Set-Cookie',`__Host-ticketsim-operator=${paired.token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=300`)
        return send(200,{expiresAt:paired.expiresAt,csrf:control.auth.session.csrf})
      }
      // Learner cookie/bearer and bridge token are intentionally not accepted.
      const matches=(request.headers.cookie??'').split(';').map(value=>value.trim()).filter(value=>value.startsWith('__Host-ticketsim-operator='))
      if(matches.length!==1)throw new Error('UNAUTHORIZED')
      const authorization=`Bearer ${matches[0].slice('__Host-ticketsim-operator='.length)}`
      const session=control.auth.authorize(authorization)
      if(request.url==='/api/operator/session'){
        if(!exact(input,[]))throw new Error('INVALID_REQUEST')
        return send(200,{csrf:session.csrf,expiresAt:new Date(session.expiresAt).toISOString()})
      }
      const credentials={authorization,csrf:request.headers['x-ticketsim-operator-csrf']}
      if(request.url==='/api/operator/catalog'){
        if(!exact(input,[]))throw new Error('INVALID_REQUEST')
        return send(200,{scenarios:control.catalog(credentials)})
      }
      if(request.url==='/api/operator/proposal'){
        if(!exact(input,['scenarioId']))throw new Error('INVALID_REQUEST')
        return send(200,control.propose(credentials,input))
      }
      if(!exact(input,['proposalId','consent']))throw new Error('INVALID_REQUEST')
      const grant=control.approve(credentials,input)
      return send(201,{approvalId:grant.approval_id,runId:grant.run_id,status:grant.status,expiresAt:new Date(grant.expires_ms).toISOString()})
    }catch(error){
      const code=/^[A-Z0-9_]{1,80}$/.test(error?.message??'')?error.message:'OPERATOR_CONTROL_FAILED'
      if(!response.headersSent)send(unauthorized.has(code)?401:409,{code})
      else response.destroy()
    }
  })
  server.requestTimeout=5000;server.headersTimeout=5000;server.maxConnections=16
  return server
}
