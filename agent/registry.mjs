import { readFileSync } from 'node:fs'
import Ajv from 'ajv'
import { LabError } from './errors.mjs'
import { mockWebProfile } from './vmProfiles.mjs'
import { validateVmProfile } from './vmProfile.mjs'

const schema = JSON.parse(readFileSync(new URL('../src/real-lab/manifest.schema.json', import.meta.url), 'utf8'))
const validate = new Ajv({ allErrors: true }).compile(schema)

const actionIds = Object.freeze({
  preflight: new Set(['mock-web-preflight-v1']),
  setup: new Set(['mock-web-nginx-unavailable-v1']),
  fault: new Set(['mock-web-nginx-stopped-v1']),
  grade: new Set(['mock-web-http-v1', 'mock-web-nginx-config-v1', 'mock-web-ssh-preserved-v1']),
  recovery: new Set(['mock-web-restore-baseline-v1']),
  recoveryCheck: new Set(['mock-web-baseline-v1']),
})

export const webPilot = Object.freeze({
  mode: 'mock-only',
  target: Object.freeze({ vmRef: 'mock:web:001', controller: 'hyperv', disposable: true }),
  preflightCheckId: 'mock-web-preflight-v1',
  recoveryCheckId: 'mock-web-baseline-v1',
  manifest: Object.freeze({
    schemaVersion: 1, id: 'LAB-WEB-001', revision: 1, title: 'Nginx service unavailable',
    relatedTicketIds: ['VPS-03-001'], guestOS: 'ubuntu-22.04', vmProfileId: 'ubuntu-web-pilot-v1',
    controller: 'hyperv', setupActionId: 'mock-web-nginx-unavailable-v1',
    faultCheckIds: ['mock-web-nginx-stopped-v1'],
    gradeCheckIds: ['mock-web-http-v1', 'mock-web-nginx-config-v1', 'mock-web-ssh-preserved-v1'],
    rollbackActionId: 'mock-web-restore-baseline-v1',
    safety: { disposableOnly: true, hostRecoveryRequired: true, maxMinutes: 25 },
  }),
})

export function validateRegistryEntry(entry) {
  if (!entry || entry.mode !== 'mock-only' || !validate(entry.manifest)) throw new LabError('INVALID_MANIFEST', 400)
  const { manifest, target } = entry
  validateVmProfile(mockWebProfile)
  if (manifest.vmProfileId !== mockWebProfile.profileId) throw new LabError('INVALID_VM_PROFILE_BINDING', 400)
  if (!target || target.vmRef !== 'mock:web:001' || target.controller !== manifest.controller || target.disposable !== true) throw new LabError('INVALID_VM_BINDING', 400)
  if (!actionIds.preflight.has(entry.preflightCheckId) || !actionIds.recoveryCheck.has(entry.recoveryCheckId) || !actionIds.setup.has(manifest.setupActionId) || !actionIds.recovery.has(manifest.rollbackActionId) || !manifest.faultCheckIds.every(id => actionIds.fault.has(id)) || !manifest.gradeCheckIds.every(id => actionIds.grade.has(id))) throw new LabError('UNKNOWN_ACTION_ID', 400)
  return entry
}

export function createScenarioRegistry(entries = [webPilot]) {
  const scenarios = new Map()
  for (const entry of entries) {
    validateRegistryEntry(entry)
    if (scenarios.has(entry.manifest.id)) throw new LabError('DUPLICATE_SCENARIO', 400)
    scenarios.set(entry.manifest.id, entry)
  }
  return Object.freeze({
    get(id) { const entry = scenarios.get(id); if (!entry) throw new LabError('UNKNOWN_SCENARIO', 404); return entry },
    list() { return [...scenarios.values()].map(({ manifest }) => ({ id: manifest.id, title: manifest.title, revision: manifest.revision, mode: 'mock-only', availableForRealVm: false })) },
  })
}
