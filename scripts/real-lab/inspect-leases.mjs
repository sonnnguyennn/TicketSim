import { existsSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { isAbsolute } from 'node:path'

const filename=process.argv[2]
if (!filename || !isAbsolute(filename) || !existsSync(filename)) throw new Error('AGENT_DATABASE_PATH_REQUIRED_OR_MISSING')
const db=new DatabaseSync(filename,{readOnly:true})
try {
  db.exec('PRAGMA query_only=ON')
  const leases=db.prepare("SELECT vm_ref,run_id,lease_state,acquired_at FROM vm_leases WHERE vm_ref='hyperv:2b9c2170-9a23-4d08-b82e-29929afa4c10'").all()
  const runs=db.prepare("SELECT run_id,phase,recovery_status,updated_at FROM lab_runs WHERE vm_ref='hyperv:2b9c2170-9a23-4d08-b82e-29929afa4c10' ORDER BY created_at DESC LIMIT 5").all()
  process.stdout.write(`${JSON.stringify({database:filename,leases,runs,clear:leases.length===0})}\n`)
} finally { db.close() }
