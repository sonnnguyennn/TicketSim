import Ajv from 'ajv'
import { isDeepStrictEqual } from 'node:util'
import { LabError } from './errors.mjs'
import { LIVE_TARGET } from './livePolicy.mjs'

// Protected release authoring data, never an HTTP-supplied executable manifest.
// These blueprints contain no deployable guest actions and cannot start a run.
const definitions = [
  ['002', 'Trang web báo lỗi dù dịch vụ đang chạy', 'Dịch vụ vẫn chạy nhưng trang được yêu cầu không truy cập được. Hãy điều tra và khôi phục trang.', 18080, ['serviceActive','pageUnreadable','clientError'], ['serviceIdentity','pagePermissions','httpContent']],
  ['003', 'Website trả nội dung không mong đợi sau triển khai', 'Sau lần triển khai, ứng dụng không phục vụ đúng trang. SSH vẫn hoạt động.', 18080, ['decoyListener','wrongContent','applicationUnavailable'], ['serviceIdentity','listenerOwner','decoyAbsent','httpContent']],
  ['007', 'Website báo Bad Gateway', 'Website báo Bad Gateway trong khi máy chủ vẫn truy cập được qua SSH.', 18081, ['backendHealthy','frontend502'], ['backendHealthy','proxyConfiguration','frontendContent']],
]
const commonChecks = ['sshAuthentication','sshHostKey','managementRoute','baseWebsiteHealthy']
const schema = {
  type:'object', additionalProperties:false,
  required:['schemaVersion','id','revision','title','ticket','vmRef','checkpointId','status','actions','checks','website','limits'],
  properties:{
    schemaVersion:{const:1},id:{enum:definitions.map(([number])=>`LAB-TLAB-${number}`)},revision:{type:'integer',minimum:1},
    title:{type:'string',minLength:1,maxLength:120},ticket:{type:'string',minLength:1,maxLength:1000},
    vmRef:{const:LIVE_TARGET.vmRef},checkpointId:{const:'e6d04330-142c-4397-8e0d-ddf5a9e69090'},status:{const:'planned'},
    actions:{type:'object',additionalProperties:false,required:['prepare','inject','recover'],properties:{prepare:{type:'string'},inject:{type:'string'},recover:{const:'real-host-reset-v1'}}},
    checks:{type:'object',additionalProperties:false,required:['prepared','fault','grade','invariants'],properties:Object.fromEntries(['prepared','fault','grade','invariants'].map(name=>[name,{type:'array',minItems:1,uniqueItems:true,items:{type:'string',pattern:'^[a-zA-Z][a-zA-Z0-9]+$'}}]))},
    website:{type:'object',additionalProperties:false,required:['id','port','path'],properties:{id:{type:'string'},port:{enum:[18080,18081]},path:{const:'/index.html'}}},
    limits:{type:'object',additionalProperties:false,required:['prepareSeconds','injectSeconds','learnerMinutes'],properties:{prepareSeconds:{type:'integer',minimum:1,maximum:300},injectSeconds:{type:'integer',minimum:1,maximum:60},learnerMinutes:{type:'integer',minimum:1,maximum:60}}},
  },
}
const validate = new Ajv({allErrors:true}).compile(schema)
function freeze(value){if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value)}return value}
const blueprints=freeze(definitions.map(([number,title,ticket,port,fault,grade])=>({
  schemaVersion:1,id:`LAB-TLAB-${number}`,revision:1,title,ticket,
  vmRef:LIVE_TARGET.vmRef,checkpointId:'e6d04330-142c-4397-8e0d-ddf5a9e69090',status:'planned',
  actions:{prepare:`real-tlab-${number}-prepare-v1`,inject:`real-tlab-${number}-inject-v1`,recover:'real-host-reset-v1'},
  checks:{prepared:number==='007'?['backendHealthy','proxyConfiguration','frontendContent']:['serviceIdentity','httpContent'],fault,grade,invariants:[...commonChecks]},
  website:{id:`tlab-${number}-website-v1`,port,path:'/index.html'},
  limits:{prepareSeconds:180,injectSeconds:30,learnerMinutes:25},
})))

export function validatePackBlueprint(candidate){
  if(!validate(candidate))throw new LabError('INVALID_SCENARIO_PACK',400)
  const authored=blueprints.find(entry=>entry.id===candidate.id)
  // The schema checks shape; protected authored definitions bind operation and
  // endpoint IDs. Merely matching the schema cannot introduce a new operation.
  if(!isDeepStrictEqual(candidate.actions,authored.actions)||
     !isDeepStrictEqual(candidate.website,authored.website)||
     !isDeepStrictEqual(candidate.checks,authored.checks)||candidate.revision!==authored.revision)
    throw new LabError('SCENARIO_PACK_BINDING_MISMATCH',400)
  return freeze(structuredClone(candidate))
}

export function getPackBlueprint(id){
  const entry=blueprints.find(candidate=>candidate.id===id)
  if(!entry)throw new LabError('UNKNOWN_SCENARIO_PACK',404)
  return entry
}

export function listPlannedPacks(){
  // Deliberately exclude actions, checks and root causes from learner metadata.
  return blueprints.map(({id,revision,title,ticket})=>({id,revision,title,ticket,status:'planned',availableForRealVm:false,
    blockers:['GUEST_BOOTSTRAP_NOT_QUALIFIED','GUEST_BUNDLE_NOT_IMPLEMENTED','ACTUAL_SCENARIO_NOT_QUALIFIED']}))
}

export function assertPackExecutable(id){
  getPackBlueprint(id)
  throw new LabError('SCENARIO_PACK_NOT_QUALIFIED',403)
}

for(const entry of blueprints)validatePackBlueprint(entry)
