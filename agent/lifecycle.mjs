import { LabError } from './errors.mjs'

const next = Object.freeze({
  preflight: ['baseline_ready', 'recovery_required'],
  baseline_ready: ['injecting', 'recovery_required'],
  injecting: ['ready', 'failed_setup', 'recovery_required'],
  ready: ['running', 'recovery_required'],
  running: ['submitting', 'recovery_required'],
  submitting: ['graded', 'failed_grading', 'recovery_required'],
  graded: ['restoring', 'recovery_required'],
  failed_setup: ['restoring', 'recovery_required'],
  failed_grading: ['restoring', 'recovery_required'],
  restoring: ['verified_clean', 'restore_failed', 'recovery_required'],
  verified_clean: ['completed', 'recovery_required'],
  restore_failed: [], recovery_required: [], completed: [],
})

export function assertTransition(from, to) {
  if (!next[from]?.includes(to)) throw new LabError('INVALID_TRANSITION')
}

export const activePhases = Object.freeze(new Set(Object.keys(next).filter(phase => phase !== 'completed')))
