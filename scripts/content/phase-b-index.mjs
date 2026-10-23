import { topicEdits as linux, sampleIds as linuxSamples } from './phase-b-01-05.mjs'
import { topicEdits as hosting, sampleIds as hostingSamples } from './phase-b-06-10.mjs'
import { topicEdits as operations, sampleIds as operationsSamples } from './phase-b-11-14.mjs'

// B1 validates a representative of every topic; B2 enables the full reviewed set.
export const phaseBStage = 'samples'
export const sampleIds = [...linuxSamples, ...hostingSamples, ...operationsSamples]
export const allPhaseBEdits = { ...linux, ...hosting, ...operations }
export const phaseBEdits = Object.fromEntries(Object.entries(allPhaseBEdits).filter(([id]) => phaseBStage === 'all' || sampleIds.includes(id)))
