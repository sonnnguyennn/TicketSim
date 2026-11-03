import ssh2 from 'ssh2'
import { createHash, randomUUID } from 'node:crypto'
import { WebSocketServer, WebSocket } from 'ws'
import { LabError } from './errors.mjs'
import { LIVE_TARGET } from './livePolicy.mjs'
const { Client } = ssh2

const LIMIT = 1024 * 1024
export function verifyGuestKey(key, expected = LIVE_TARGET.sshFingerprint) {
  return `SHA256:${createHash('sha256').update(key).digest('base64').replace(/=+$/, '')}` === expected
}

/** The host, account, host-key pin and allowed subsystem are NOT request parameters. */
export function openGuestPty(password, { makeClient = () => new Client(), fingerprint = LIVE_TARGET.sshFingerprint } = {}) {
  return new Promise((resolve, reject) => {
    const client = makeClient()
    let settled = false
    const timeout=setTimeout(()=>fail(),15_000)
    const fail = () => { if (!settled) { settled = true; clearTimeout(timeout); client.destroy(); reject(new LabError('LEARNER_SSH_AUTH_FAILED', 401)) } }
    client.on('error', fail)
    client.once('ready', () => {
      client.shell({ term:'xterm-256color', rows:24, cols:80, width:0, height:0 }, (error, channel) => {
        if (error) return fail()
        settled = true; clearTimeout(timeout); resolve({ client, channel })
      })
    })
    client.connect({host:LIVE_TARGET.managementIp,port:22,username:'lab',password,
      hostVerifier:key=>verifyGuestKey(key,fingerprint),agentForward:false,
      tryKeyboard:false,readyTimeout:12_000,keepaliveInterval:10_000,keepaliveCountMax:2})
    // ssh2 necessarily retains authentication material until handshake completes; never serialize it.
    password = undefined
  })
}

export class TerminalService {
  constructor({ assertScope, connect = openGuestPty, now = () => Date.now(), graceMs = 60_000 } = {}) {
    this.assertScope=assertScope; this.connect=connect; this.now=now; this.graceMs=graceMs
    this.sessions=new Map(); this.pending=false; this.closeFailures=new Set()
    this.wss=new WebSocketServer({noServer:true,maxPayload:64*1024,perMessageDeflate:false})
    this.timer=setInterval(()=>this.sweep(),5000); this.timer.unref()
  }
  async create(owner, runId, password) {
    await this.assertScope(runId)
    const existing=[...this.sessions.values()][0]
    if (existing) {
      if(existing.owner===owner && existing.runId===runId) return this.describe(existing)
      throw new LabError('TERMINAL_ALREADY_HELD',409)
    }
    if(this.pending) throw new LabError('TERMINAL_CONNECTING',409)
    if(typeof password!=='string'||password.length<1||password.length>256) throw new LabError('LEARNER_PASSWORD_REQUIRED',400)
    this.pending=true
    let transport
    try {
      transport=await this.connect(password)
      await this.assertScope(runId)
      const session={id:randomUUID(),owner,runId,...transport,ws:null,buffer:[],bytes:0,
        createdAt:this.now(),detachedAt:this.now(),revoked:false,inputBytes:0,inputWindow:this.now()}
      this.sessions.set(session.id,session)
      const output=chunk=>{
        if(session.revoked)return
        const bytes=Buffer.from(chunk)
        session.buffer.push(bytes);session.bytes+=bytes.length
        while(session.bytes>LIMIT&&session.buffer.length){session.bytes-=session.buffer.shift().length}
        if(session.ws?.readyState===WebSocket.OPEN){
          if(session.ws.bufferedAmount>LIMIT) session.ws.close(1008,'Output limit')
          else session.ws.send(bytes,{binary:true})
        }
      }
      session.channel.on('data',output)
      session.channel.stderr?.on('data',output)
      session.channel.on('error',()=>this.revoke(session))
      session.client.on('error',()=>this.revoke(session))
      session.client.on('close',()=>this.revoke(session))
      session.channel.on('close',()=>this.revoke(session))
      return this.describe(session)
    } catch(error) { transport?.client.destroy(); throw error }
    finally { password=undefined; this.pending=false }
  }
  describe(s){return {id:s.id,runId:s.runId,connected:!!s.ws,createdAt:new Date(s.createdAt).toISOString()}}
  current(owner){const s=[...this.sessions.values()].find(s=>s.owner===owner);return s?this.describe(s):null}
  async upgrade(req,socket,head,owner,id,authorize=()=>{}){
    const session=this.sessions.get(id)
    if(!session||session.owner!==owner||session.revoked)throw new LabError('TERMINAL_NOT_FOUND',404)
    await this.assertScope(session.runId)
    if(session.revoked)throw new LabError('TERMINAL_REVOKED',403)
    if(session.ws&&session.ws.readyState!==WebSocket.CLOSED)throw new LabError('TERMINAL_WRITER_HELD',409)
    this.wss.handleUpgrade(req,socket,head,ws=>{
      session.ws=ws;session.authorize=authorize;session.detachedAt=null
      for(const chunk of session.buffer)ws.send(chunk,{binary:true})
      ws.on('error',()=>ws.terminate())
      ws.on('close',()=>{if(session.ws===ws){session.ws=null;session.detachedAt=this.now()}})
      ws.on('message',async(data,isBinary)=>{
        if(session.revoked||session.ws!==ws)return ws.close(1008,'Revoked')
        try{
          if(isBinary)throw new Error('Invalid frame')
          const frame=JSON.parse(data.toString())
          if(this.now()-session.inputWindow>=1000){session.inputBytes=0;session.inputWindow=this.now()}
          session.inputBytes+=data.length
          if(session.inputBytes>64*1024)throw new Error('Input limit')
          authorize();await this.assertScope(session.runId)
          if(session.revoked||session.ws!==ws)return ws.close(1008,'Revoked')
          if(frame.type==='input'&&Object.keys(frame).sort().join(',')==='data,type'&&typeof frame.data==='string'&&Buffer.byteLength(frame.data)<=16*1024){
            // Phase is frozen synchronously by closeRun before any grade/reset starts.
            if(session.channel.writableLength>64*1024)throw new Error('Guest backpressure limit')
            if(session.channel.write(frame.data)===false)ws.send(JSON.stringify({type:'pause'}))
          }else if(frame.type==='resize'&&Object.keys(frame).sort().join(',')==='cols,rows,type'&&Number.isInteger(frame.rows)&&Number.isInteger(frame.cols)&&frame.rows>=2&&frame.rows<=200&&frame.cols>=10&&frame.cols<=400){
            session.channel.setWindow(frame.rows,frame.cols,0,0)
          }else throw new Error('Invalid frame')
        }catch{ws.close(1008,'Invalid terminal frame')}
      })
      const drain=()=>{if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'resume'}))}
      session.channel.on('drain',drain)
      ws.once('close',()=>session.channel.off('drain',drain))
    })
  }
  revoke(s){
    if(s.revoked)return
    s.revoked=true;this.sessions.delete(s.id)
    s.ws?.close(1000,'Terminal closed');s.channel.close();s.client.end()
  }
  async closeRun(runId){
    if(this.closeFailures.has(runId))throw new LabError('TERMINAL_CLOSE_UNKNOWN')
    const sessions=[...this.sessions.values()].filter(s=>s.runId===runId)
    await Promise.all(sessions.map(s=>new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{this.closeFailures.add(runId);reject(new LabError('TERMINAL_CLOSE_UNKNOWN'));s.client.destroy()},3000)
      s.channel.once('close',()=>{clearTimeout(timer);resolve()})
      this.revoke(s)
    })))
  }
  sweep(){for(const s of [...this.sessions.values()]){
    try{s.authorize?.()}catch{s.ws?.close(1008,'Session expired')}
    if(s.detachedAt!==null&&this.now()-s.detachedAt>=this.graceMs||s.runId===null&&this.now()-s.createdAt>=10*60_000)this.revoke(s)
  }}
  close(){clearInterval(this.timer);for(const s of [...this.sessions.values()])this.revoke(s);this.wss.close()}
}
