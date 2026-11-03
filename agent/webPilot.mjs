import { LabError } from './errors.mjs'
import { LIVE_TARGET, assertLiveObservation, checkVerdict, liveChecks } from './livePolicy.mjs'

const uuid=value=>typeof value==='string'&&/^[0-9a-f-]{36}$/i.test(value)
export const learnerEvents=events=>events.map(event=>({...event,metadata:Object.fromEntries(Object.entries(event.metadata).filter(([key])=>key!=='operationId')),metadata_json:undefined}))
export class WebPilot {
  constructor({store,operations,approval,terminalOnly=true,terminal=null,liveService=null}={}){
    Object.assign(this,{store,operations,approval,terminalOnly,terminal,liveService})
    this.lastPreflight=null;this.preflightPending=null;this.authenticated=new Map()
  }
  async preflight(){
    if(this.preflightPending)return this.preflightPending
    this.preflightPending=(async()=>{
      if(this.store.getLease(LIVE_TARGET.vmRef))throw new LabError('VM_LEASE_HELD',409)
      const observation=assertLiveObservation(await this.operations.observe('preflight',this.approval),this.approval)
      this.lastPreflight={checkedAt:new Date().toISOString(),verdict:checkVerdict(observation.checks,liveChecks.preflight),checks:Object.fromEntries(liveChecks.preflight.map(id=>[id,observation.checks[id]]))}
      return this.lastPreflight
    })().finally(()=>{this.preflightPending=null})
    return this.preflightPending
  }
  async assertTerminalScope(runId){
    if(runId===null){
      if(this.store.db.prepare("SELECT 1 FROM web_operations WHERE status IN ('pending','unknown')").get())throw new LabError('OPERATION_REQUIRES_REVIEW',409)
      if(this.store.getLease(LIVE_TARGET.vmRef)||this.store.listRuns().some(r=>r.mode==='real'&&!r.completed_at))throw new LabError('PREVIEW_BLOCKED_BY_RUN',409)
      if(this.lastPreflight?.verdict!=='pass'||Date.now()-Date.parse(this.lastPreflight.checkedAt)>5*60_000)throw new LabError('FRESH_PREFLIGHT_REQUIRED',409)
    }else{
      if(!uuid(runId))throw new LabError('INVALID_RUN_ID',400)
      const run=this.store.getRun(runId)
      const lease=this.store.getLease(LIVE_TARGET.vmRef)
      if(!uuid(runId)||!run||run.mode!=='real'||run.vm_ref!==LIVE_TARGET.vmRef||run.phase!=='running'||lease?.run_id!==runId||lease?.lease_state!=='active'||Date.now()-Date.parse(run.started_at)>=25*60_000)throw new LabError('TERMINAL_PHASE_DENIED',403)
    }
  }
  state(owner){
    const runs=this.store.listRuns().filter(r=>r.mode==='real')
    const run=runs.find(r=>!r.completed_at)??runs[0]??null
    const operations=this.store.db.prepare('SELECT * FROM web_operations ORDER BY created_at DESC LIMIT 8').all()
    return {terminalOnly:this.terminalOnly,runs,run,events:run?learnerEvents(this.store.getEvents(run.run_id)):[],operations,
      terminal:this.terminal.current(owner),preflight:this.lastPreflight,
      deadlineAt:run?.started_at?new Date(Date.parse(run.started_at)+25*60_000).toISOString():null}
  }
  accept(key,kind,runId,work){
    const accepted=this.store.acceptOperation(key,kind,runId)
    if(!accepted.duplicate)Promise.resolve().then(work).then(run=>this.store.finishOperation(key,run?.run_id??runId),error=>this.store.finishOperation(key,runId,error instanceof LabError?error.code:'WEB_OPERATION_FAILED'))
    return this.store.getOperation(key)
  }
  start(key,owner){
    if(this.terminalOnly||!this.liveService)throw new LabError('TRIAL_NOT_ARMED',403)
    const existing=this.store.getOperation(key)
    if(existing){if(existing.kind!=='start')throw new LabError('IDEMPOTENCY_KEY_REUSED');return existing}
    if(this.store.listRuns().some(run=>run.mode==='real'))throw new LabError('FIRST_TRIAL_ALREADY_RECORDED',409)
    if(!this.authenticated.get(owner)||Date.now()-this.authenticated.get(owner)>5*60_000)throw new LabError('LEARNER_AUTH_CHECK_REQUIRED',409)
    return this.accept(key,'start',null,async()=>{
      await this.terminal.closeRun(null)
      return this.liveService.start('LAB-WEB-001',key)
    })
  }
  submit(key,runId,note){
    if(this.terminalOnly||!this.liveService)throw new LabError('TRIAL_NOT_ARMED',403)
    const existing=this.store.getOperation(key)
    if(existing){if(existing.kind!=='submit'||existing.run_id!==runId)throw new LabError('IDEMPOTENCY_KEY_REUSED');return existing}
    this.store.saveNote(runId,note)
    return this.accept(key,'submit',runId,()=>this.liveService.submit(runId,key,note))
  }
}
