export type Probe = {
  probe_id: string
  command: string
  stdout: string
  available: boolean
  mutates_guest: boolean
}

export type Ticket = {
  id: string
  topic: string
  topic_vi: string
  topic_code: string
  difficulty: 0 | 1 | 2 | 3
  level_label: string
  customer_message: string
  guest_os: string
  environment: string
  status: string
  priority: string
  probe_outputs: Probe[]
  hands_on_mode: string
  safe_to_execute_as_written: boolean
  resolution_confidence: string
  skill_tags: string[]
}

export type Answer = {
  expected_diagnosis: string
  recommended_next_checks: string
  resolution_guidance: string
  verification: string
  escalate_when: string
  production_warning: string
  scoring_rubric: Record<ScoreKey, number>
}

export type FormFields = {
  issue: string
  hypothesis: string
  evidence: string
  nextCheck: string
  action: string
  verification: string
  escalation: string
}

export type ScoreKey = 'symptom_identification' | 'evidence_reasoning' | 'additional_checks' | 'safe_resolution' | 'verification_or_escalation'
export type ScoreChecks = Record<ScoreKey, boolean>
export type CommandEntry = { id: string; probeId?: string; command: string; output: string; supported: boolean; kind: 'terminal' | 'investigation'; at: string; state?: string }
export type Attempt = { id: string; ticketId: string; createdAt: string; roundId?: string; form: FormFields; commands: CommandEntry[]; hintViewed: boolean; selfScore: number; checks: ScoreChecks }
export type Draft = { roundId?: string; form: FormFields; commands: CommandEntry[]; hintViewed: boolean; answerRevealed: boolean; checks: ScoreChecks }
export type GuidedFeedback = { correct: boolean; correctIds: string[]; explanation: string; optionFeedback: Record<string, string>; commandId?: string }
export type GuidedDraft = { stage: number; responses: Record<string, string[]>; feedback: Record<string, GuidedFeedback>; commands: CommandEntry[]; hintLevel: number; note: string; submitted: boolean }
export type GuidedAttempt = { id: string; ticketId: string; createdAt: string; responses: Record<string, string[]>; commands: CommandEntry[]; hintLevel: number; note: string; score: number; total: number; independent: boolean; outcomes?: Record<string, boolean> }
export type ReviewAttempt = { id: string; ticketId: string; createdAt: string; sourceAttemptId: string; questionIds: string[]; responses: Record<string, string[]>; outcomes: Record<string, boolean>; kind: 'mistakes' | 'retest'; variantId?: string }
export type ExamForm = { symptom: string; hypothesis: string; evidence: string; action: string; verification: string }
export type ExamDraft = { form: ExamForm; commands: CommandEntry[]; submittedAttemptId?: string }
export type ExamAttempt = { id: string; ticketId: string; createdAt: string; form: ExamForm; commands: CommandEntry[]; checks?: ScoreChecks; selfScore?: number }
export type LearningError = { category: 'knowledge' | 'missing_evidence' | 'unsafe_action'; detail: string; at: string; questionId?: string }
export type SupportLevel = 'beginner' | 'normal' | 'independent'
export type StatefulDraft = { state: string; commands: CommandEntry[]; actionId?: string; actionOutput?: string; actionFeedback?: string; approval: boolean; note: string; completed: boolean; errors: LearningError[] }
export type StatefulAttempt = { id: string; ticketId: string; createdAt: string; state: string; commands: CommandEntry[]; actionId?: string; note: string; errors: LearningError[] }
export type ObjectiveExamDraft = { responses: Record<string, string[]>; commands: CommandEntry[]; submittedAttemptId?: string }
export type ObjectiveExamAttempt = { id: string; ticketId: string; createdAt: string; responses: Record<string, string[]>; commands: CommandEntry[]; outcomes: Record<string, boolean>; score: number; total: number; errors: LearningError[] }
export type LegacyProgress = { version: 1; drafts: Record<string, Draft>; attempts: Attempt[] }
export type Progress = { version: 5; supportLevel?: SupportLevel; drafts: Record<string, Draft>; attempts: Attempt[]; guidedDrafts: Record<string, GuidedDraft>; guidedAttempts: GuidedAttempt[]; reviewAttempts: ReviewAttempt[]; examDrafts: Record<string, ExamDraft>; examAttempts: ExamAttempt[]; statefulDrafts: Record<string, StatefulDraft>; statefulAttempts: StatefulAttempt[]; objectiveExamDrafts: Record<string, ObjectiveExamDraft>; objectiveExamAttempts: ObjectiveExamAttempt[] }
