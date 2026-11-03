import { createHash,randomUUID,timingSafeEqual } from 'node:crypto'
import { PairingManager } from '../agent/auth.mjs'
import { getPackBlueprint,listPlannedPacks } from '../agent/scenarioPacks.mjs'
import { LIVE_TARGET } from '../agent/livePolicy.mjs'

const requireCheck=(condition,code)=>{if(!condition)throw new Error(code)}
const same=(a,b)=>typeof a==='string'&&typeof b==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b))
const effects={
  'LAB-TLAB-002':['prepare non-root Python HTTP service on port 18080','set only the authored training index file mode to 000'],
  'LAB-TLAB-003':['prepare non-root Python HTTP service on port 18080','stop the intended training service, occupy port 18080 with the fixed decoy, and attempt the intended service start'],
  'LAB-TLAB-007':['prepare loopback backend on 18082 and Nginx training frontend on 18081','change only the authored training proxy upstream to reproduce HTTP 502'],
}

/** No listener is installed by this module. The eventual HTTPS Operator route
 * must enforce loopback Host/Origin and bind this service to its own protected
 * pairing code, never to the learner auth manager or machine bridge token.
 * principal/release resolver/legacy inspection are trusted startup dependencies.
 */
export class OperatorApprovalControl {
  constructor({journal,principal,resolveRelease,inspectLegacy,now=()=>Date.now(),pairingCode}={}){
    requireCheck(journal&&typeof resolveRelease==='function'&&typeof inspectLegacy==='function','OPERATOR_CONTROL_DEPENDENCIES_REQUIRED')
    requireCheck(typeof principal==='string'&&/^[^\\\r\n]{1,80}\\[^\\\r\n]{1,80}$/.test(principal)&&!/\\TicketSimAgent$/i.test(principal),'OPERATOR_PRINCIPAL_REQUIRED')
    this.journal=journal;this.principal=principal;this.resolveRelease=resolveRelease;this.inspectLegacy=inspectLegacy;this.now=now
    this.auth=new PairingManager({pairingCode,now,sessionTtlMs:5*60_000,absoluteTtlMs:5*60_000})
    this.proposals=new Map()
  }
  #authorize(credentials){
    const session=this.auth.authorize(credentials?.authorization)
    requireCheck(same(session.csrf,credentials?.csrf),'OPERATOR_CSRF_REQUIRED')
    return session
  }
  #release(scenarioId){
    const pack=getPackBlueprint(scenarioId),release=this.resolveRelease(scenarioId)
    requireCheck(release?.qualified===true&&release.scenarioId===pack.id&&release.revision===pack.revision&&/^[a-f0-9]{64}$/.test(release.bundleSha256),'SCENARIO_RELEASE_NOT_QUALIFIED')
    return {pack,release}
  }
  catalog(credentials){
    this.#authorize(credentials)
    return listPlannedPacks().map(entry=>{
      let availableForApproval=false
      try{this.#release(entry.id);availableForApproval=true}catch{/* never treat an unknown release as qualified */}
      return {...entry,availableForApproval}
    })
  }
  propose(credentials,{scenarioId}={}){
    const session=this.#authorize(credentials)
    const {pack,release}=this.#release(scenarioId)
    const scope={scenarioId:pack.id,revision:pack.revision,runId:randomUUID(),bundleSha256:release.bundleSha256,
      vmId:LIVE_TARGET.vmId,checkpointId:pack.checkpointId,actions:{...pack.actions}}
    const proposalId=randomUUID(),digest=createHash('sha256').update(JSON.stringify(scope)).digest('hex')
    for(const [id,proposal] of this.proposals)if(this.now()>=proposal.expiresAt)this.proposals.delete(id)
    requireCheck(this.proposals.size<8,'TOO_MANY_APPROVAL_PROPOSALS')
    const proposal={proposalId,scope,owner:session.owner,expiresAt:this.now()+5*60_000,consent:`APPROVE ${digest}`}
    this.proposals.set(proposalId,proposal)
    return {proposalId,scope:structuredClone(scope),expiresAt:new Date(proposal.expiresAt).toISOString(),consent:proposal.consent,
      effects:[...effects[pack.id],'preserve SSH and management network','revoke learner terminal before grading actual state',
        `clean shutdown original ${scope.vmId}, restore checkpoint ${scope.checkpointId}, boot, independently verify baseline, finalize and release lease`],
      recoveryBranches:['submit','timeout','failed_prepare','failed_setup']}
  }
  approve(credentials,{proposalId,consent}={}){
    const session=this.#authorize(credentials),proposal=this.proposals.get(proposalId)
    requireCheck(proposal&&proposal.owner===session.owner&&this.now()<proposal.expiresAt,'APPROVAL_PROPOSAL_EXPIRED_OR_UNKNOWN')
    requireCheck(same(consent,proposal.consent),'EXACT_OPERATOR_CONSENT_REQUIRED')
    const {release}=this.#release(proposal.scope.scenarioId)
    requireCheck(release.bundleSha256===proposal.scope.bundleSha256,'SCENARIO_RELEASE_CHANGED')
    // The legacy snapshot is an extra guard, not a cross-process lock. Real
    // activation must first retire old admission writers under Operator control.
    const legacy=this.inspectLegacy()
    requireCheck(legacy?.stateClear===true&&legacy.mutationAuthorized===false,'LEGACY_RUNTIME_REQUIRES_REVIEW')
    const grant=this.journal.issue(proposal.scope,{principal:this.principal})
    this.proposals.delete(proposalId)
    return grant
  }
  // Internal machine-bridge integration point, not an unauthenticated route.
  claimApproved(approvalId,runId){
    const grant=this.journal.get(approvalId)
    requireCheck(grant?.run_id===runId,'APPROVAL_SCOPE_MISMATCH')
    const {release}=this.#release(grant.scope.scenarioId)
    requireCheck(release.bundleSha256===grant.scope.bundleSha256,'SCENARIO_RELEASE_CHANGED')
    return this.journal.claim(approvalId,grant.scope)
  }
}
