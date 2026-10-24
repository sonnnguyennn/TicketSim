import { topicEdits as linux, sampleIds as linuxSamples } from './phase-b-01-05.mjs'
import { topicEdits as hosting, sampleIds as hostingSamples } from './phase-b-06-10.mjs'
import { topicEdits as operations, sampleIds as operationsSamples } from './phase-b-11-14.mjs'
import { editorialEdits as dnsEditorialEdits } from './phase-b-08-editorial.mjs'
import { editorialEdits as securityEditorialEdits } from './phase-b-09-editorial.mjs'
import { applyEditorialEdits } from './apply-editorial-edits.mjs'

export const dnsEditorialPatchCount = applyEditorialEdits(hosting, dnsEditorialEdits)
export const securityEditorialPatchCount = applyEditorialEdits(hosting, securityEditorialEdits)

// Every Guided case now uses its individually reviewed Phase B authoring record.
export const phaseBStage = 'all'
export const sampleIds = [...linuxSamples, ...hostingSamples, ...operationsSamples]
export const allPhaseBEdits = { ...linux, ...hosting, ...operations }
export const phaseBEdits = Object.fromEntries(Object.entries(allPhaseBEdits).filter(([id]) => phaseBStage === 'all' || sampleIds.includes(id)))
if (phaseBStage === 'all' && Object.keys(phaseBEdits).length !== 112) throw new Error('Full Guided authoring requires112 explicitcase records; no template fallback')
