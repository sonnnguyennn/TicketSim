import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { realpathSync } from 'node:fs'
import { verifyRelease } from '../../operator/bootstrapPolicy.mjs'
import { readActiveUpgrade } from '../../operator/upgradeRecovery.mjs'

const root=resolve(fileURLToPath(new URL('../..',import.meta.url)))
if(process.platform!=='win32'||!/^C:\\Program Files\\TicketSimPilot\\releases\\[0-9a-f-]{36}$/i.test(root)||realpathSync(process.execPath).toLowerCase()!==resolve(root,'node.exe').toLowerCase())throw new Error('PROTECTED_RELEASE_VERIFIER_REQUIRED')
const {record}=readActiveUpgrade('C:/ProgramData/TicketSimPilot')
if(resolve(record.releaseRoot)!==root||record.manifestSha256!==process.argv[2])throw new Error('OPERATOR_RELEASE_BINDING_MISMATCH')
process.stdout.write(`${JSON.stringify(verifyRelease(root,process.argv[2]))}\n`)
