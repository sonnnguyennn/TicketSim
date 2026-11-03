import { readFileSync,existsSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

const knownHostCodes=['VM_IDENTITY_MISMATCH','CHECKPOINT_ID_MISMATCH','CHECKPOINT_TYPE_MISMATCH','TARGET_DISK_MISMATCH','DISK_CHAIN_INVALID','DISK_CHAIN_BASE_MISMATCH','BACKUP_MISSING','BACKUP_HASH_MISMATCH','MANAGEMENT_BINDING_MISMATCH','RESOURCE_UNKNOWN','B5_OPERATOR_LEASE_UNRESOLVED']
const safeCodes=new Set(['EACCES','EPERM','ENOENT','ETIMEDOUT','ENOBUFS','ERR_SQLITE_ERROR','ERR_CHILD_PROCESS_STDIO_MAXBUFFER','ERR_INVALID_ARG_TYPE'])
const domainCodes=new Set([...knownHostCodes,'TRIAL_ORIGINAL_MISMATCH','TRIAL_CHECKPOINT_MISMATCH','TRIAL_OTHER_VM_STATE_MISMATCH','TRIAL_BACKUP_MISMATCH','TRIAL_RESOURCES_FAILED','MAINTENANCE_DATABASE_MISSING','MAINTENANCE_DATABASE_VERSION_UNSUPPORTED','MAINTENANCE_CONTROL_SCHEMA_INCOMPLETE'])
export function safeUpgradeFailure(error){
  const hostCode=knownHostCodes.find(code=>String(error?.stderr??'').includes(code))
  return {name:['Error','TypeError','SyntaxError','RangeError'].includes(error?.name)?error.name:'Error',
    code:hostCode??(safeCodes.has(error?.code)?error.code:domainCodes.has(error?.message)?error.message:'UNCLASSIFIED_FAILURE'),
    exitCode:Number.isInteger(error?.code)?error.code:null,
    sqliteCode:Number.isInteger(error?.errcode)?error.errcode:null,
    signal:['SIGTERM','SIGKILL','SIGINT'].includes(error?.signal)?error.signal:null,killed:error?.killed===true}
}

function readEvidence(filename){
  const text=readFileSync(filename,'utf8')
  return {value:JSON.parse(text.replace(/^\uFEFF/,'')),utf8Bom:text.charCodeAt(0)===0xfeff}
}

/** Purely read-only diagnostic. Never constructs a writable journal, releases
 * a gate, starts/stops a process or retries an upgrade. File paths are trusted
 * startup/test dependencies; the CLI below uses only fixed protected locations.
 */
export async function inspectUpgradeFailure({stateRoot,readReport,inspectState}){
  const result={checkedAt:new Date().toISOString(),readOnly:true,upgrade:null,evidenceFiles:{},control:null}
  let record
  for(const [key,name] of Object.entries({upgrade:'m4-upgrade.json',m1:'m1-evidence.json',processes:'processes.json',preparation:'preparation.json'})){
    const filename=`${stateRoot}/operator/${name}`
    try{
      const read=readEvidence(filename)
      result.evidenceFiles[key]={readable:true,utf8Bom:read.utf8Bom}
      if(key==='upgrade'){
        record=read.value
        result.upgrade={phase:record.phase,ownerId:record.ownerId,releaseRoot:record.releaseRoot,startedAt:record.startedAt}
      }
    }catch(error){result.evidenceFiles[key]={readable:false,failure:safeUpgradeFailure(error)}}
  }
  let db
  try{
    db=new DatabaseSync(`${stateRoot}/operator/actions.sqlite`,{readOnly:true});db.exec('PRAGMA query_only=ON')
    const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('control_gate','control_events')").all()
    if(tables.length===2){
      result.control={gates:db.prepare('SELECT vm_id,kind,owner_id FROM control_gate').all(),
        events:db.prepare('SELECT sequence,kind,reference_id,occurred_ms FROM control_events ORDER BY sequence DESC LIMIT 12').all().reverse()}
    }else result.control={schemaPresent:false}
  }catch(error){result.control={failure:safeUpgradeFailure(error)}}finally{db?.close()}
  result.archiveExists={m1:existsSync(`${stateRoot}/operator/m4-previous-m1.json`),processes:existsSync(`${stateRoot}/operator/m4-previous-processes.json`)}
  if(inspectState){try{result.maintenance=inspectState(record?.ownerId??null)}catch(error){result.maintenance={failure:safeUpgradeFailure(error)}}}
  if(readReport){
    try{
      const report=await readReport()
      result.m3={livePass:report.livePass,runId:report.runId,phase:report.phase,resetAttempts:report.resetAttempts,leaseClear:report.leaseClear,workClear:report.workClear,
        targetState:report.host?.targetState,recoveryState:report.host?.recoveryState,protectedState:report.host?.protectedState}
    }catch(error){result.m3={failure:safeUpgradeFailure(error)}}
  }
  return result
}
