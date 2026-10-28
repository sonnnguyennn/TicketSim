/** Frontend contracts/prototype. The local agent owns all mock lifecycle decisions. */
export const LAB_SCHEMA_VERSION = 1 as const

export type LabPhase = 'idle' | 'preflight' | 'baseline_ready' | 'injecting' | 'ready' | 'running' | 'submitting' | 'graded' | 'restoring' | 'verified_clean' | 'failed_setup' | 'failed_grading' | 'recovery_required' | 'restore_failed'
export type ControllerKind = 'hyperv' | 'multipass'
export type CheckStatus = 'pass' | 'fail' | 'unknown'

export interface LabScenario {
  schemaVersion: typeof LAB_SCHEMA_VERSION
  id: string
  revision: number
  title: string
  relatedTicketIds: string[]
  guestOS: 'ubuntu-22.04'
  vmProfileId: string
  controller: ControllerKind
  setupActionId: string
  faultCheckIds: string[]
  gradeCheckIds: string[]
  rollbackActionId: string
  safety: { disposableOnly: true; hostRecoveryRequired: true; maxMinutes: number }
}

export interface PreflightCheck {
  id: string
  status: CheckStatus
  detail: string
}

export interface PreflightResult {
  checkedAt: string
  host: 'windows'
  targetVmId: string | null
  controller: ControllerKind | null
  checks: PreflightCheck[]
  ready: boolean
}

export interface LabRun {
  id: string
  scenarioId: string
  scenarioRevision: number
  targetVmId: string
  controller: ControllerKind
  phase: LabPhase
  createdAt: string
  updatedAt: string
  eventSequence: number
  failureReason?: string
}

export interface VmIdentity { id: string; controller: ControllerKind; disposable: boolean }
export interface VmSnapshot { identity: VmIdentity; powerState: 'running' | 'off' | 'unknown'; observedAt: string }

/** Phase 0 interface exposes discovery only. Mutating methods require a separate reviewed interface. */
export interface VmController {
  readonly kind: ControllerKind
  inspect(identity: VmIdentity): Promise<VmSnapshot | null>
}

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value)
const nonempty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const ids = (value: unknown) => Array.isArray(value) && value.length > 0 && value.every(nonempty) && new Set(value).size === value.length

export function validateLabScenario(value: unknown): { valid: true; scenario: LabScenario } | { valid: false; errors: string[] } {
  const errors: string[] = []
  if (!isRecord(value)) return { valid: false, errors: ['Manifest must be an object'] }
  if (value.schemaVersion !== LAB_SCHEMA_VERSION) errors.push('Unsupported schemaVersion')
  if (!nonempty(value.id) || !/^LAB-[A-Z0-9-]+$/.test(value.id)) errors.push('Invalid id')
  if (!Number.isSafeInteger(value.revision) || Number(value.revision) < 1) errors.push('Invalid revision')
  for (const key of ['title', 'vmProfileId', 'setupActionId', 'rollbackActionId']) if (!nonempty(value[key])) errors.push(`Missing ${key}`)
  for (const key of ['relatedTicketIds', 'faultCheckIds', 'gradeCheckIds']) if (!ids(value[key])) errors.push(`Invalid ${key}`)
  if (value.guestOS !== 'ubuntu-22.04') errors.push('Unsupported guestOS')
  if (value.controller !== 'hyperv' && value.controller !== 'multipass') errors.push('Invalid controller')
  if (!isRecord(value.safety) || value.safety.disposableOnly !== true || value.safety.hostRecoveryRequired !== true || !Number.isSafeInteger(value.safety.maxMinutes) || Number(value.safety.maxMinutes) < 1 || Number(value.safety.maxMinutes) > 240) errors.push('Invalid safety policy')
  if (isRecord(value.safety)) for (const key of Object.keys(value.safety)) if (!['disposableOnly', 'hostRecoveryRequired', 'maxMinutes'].includes(key)) errors.push(`Unexpected safety field ${key}`)
  const allowed = new Set(['schemaVersion', 'id', 'revision', 'title', 'relatedTicketIds', 'guestOS', 'vmProfileId', 'controller', 'setupActionId', 'faultCheckIds', 'gradeCheckIds', 'rollbackActionId', 'safety'])
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`Unexpected field ${key}`)
  return errors.length ? { valid: false, errors } : { valid: true, scenario: value as unknown as LabScenario }
}

const transitions: Record<LabPhase, readonly LabPhase[]> = {
  idle: ['preflight'], preflight: ['baseline_ready', 'recovery_required'], baseline_ready: ['injecting', 'recovery_required'],
  injecting: ['ready', 'failed_setup', 'recovery_required'], ready: ['running', 'recovery_required'],
  running: ['submitting', 'recovery_required'], submitting: ['graded', 'failed_grading', 'recovery_required'],
  graded: ['restoring'], restoring: ['verified_clean', 'restore_failed'], verified_clean: ['idle'],
  failed_setup: ['restoring'], failed_grading: ['restoring'], recovery_required: ['restoring'], restore_failed: ['restoring'],
}

export function transitionLabRun(run: LabRun, next: LabPhase, at: string, reason?: string): LabRun {
  if (!transitions[run.phase].includes(next)) throw new Error(`Invalid lab transition: ${run.phase} -> ${next}`)
  if (!Number.isFinite(Date.parse(at))) throw new Error('Invalid event timestamp')
  if (Date.parse(at) < Date.parse(run.updatedAt)) throw new Error('Event timestamp precedes run state')
  if (next === 'baseline_ready' && !run.targetVmId) throw new Error('Target VM identity required')
  if (next === 'ready' && run.phase !== 'injecting') throw new Error('Fault verification required')
  if (next === 'verified_clean' && run.phase !== 'restoring') throw new Error('Host recovery verification required')
  return { ...run, phase: next, updatedAt: at, eventSequence: run.eventSequence + 1, failureReason: reason }
}

export function preflightReady(result: PreflightResult): boolean {
  return result.ready && !!result.targetVmId && !!result.controller && result.checks.length > 0 && result.checks.every(check => check.status === 'pass')
}
