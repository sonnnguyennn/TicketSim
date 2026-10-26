export type GuidedStage = 'triage' | 'investigate' | 'interpret' | 'decide' | 'verify'
export type GuidedQuestionKind = 'single_choice' | 'multi_select' | 'command_choice' | 'output_interpretation' | 'step_order' | 'short_answer'
export type GuidedProbe = { id: string; command: string; output: string; purpose: string; why?: string; meaning: string; commandId?: string; context: 'guest' | 'client' | 'panel' | 'hypervisor'; aliases: string[]; requiredState?: string[]; branchId?: string }
export type GuidedQuestion = { id: string; stage: GuidedStage; kind: GuidedQuestionKind; prompt: string; options: { id: string; label: string }[]; requiredProbeIds?: string[]; commandId?: string; skill?: string }
export type ReviewVariant = { id: string; scenario: string; evidence: { label: string; output: string }[]; questions: GuidedQuestion[] }
export type SimulationTransition = { actionId: string; commandId?: string; label: string; from: string; to: string; requiredProbeIds: string[]; context: 'guest' | 'client' | 'panel' | 'hypervisor'; safety: 'change' | 'escalate'; requiresApproval: boolean; allowed: boolean; output: string; feedback: string; category?: 'knowledge' | 'missing_evidence' | 'unsafe_action' }
export type GuidedCase = { id: string; objective: string; customerFollowup?: string; customerExplanation?: string; probes: GuidedProbe[]; questions: GuidedQuestion[]; verificationPrompt: string; objectiveExam?: GuidedQuestion; reviewVariants?: ReviewVariant[]; branches?: { id: string; requiredProbeIds: string[]; probeIds: string[]; questionIds: string[] }[]; simulation?: { states: string[]; transitions: SimulationTransition[]; verificationProbeIds: string[] } }
export type GuidedAnswerKey = { correctIds: string[]; explanation: string; optionFeedback: Record<string, string>; commandId?: string }
export type CommandOption = { name: string; purpose: string; when: string; example: string; osNote?: string }
export type CommandUsage = { command: string; purpose: string; expectedOutput: string; interpretation: string; outputIsExcerpt: boolean; context: string }
export type SupportTask = { where: string; dataToCheck: string[]; authority: string; observableOutcomes: string[]; limits: string; escalation: string }
export type CommandKnowledge = {
  kind: 'shell' | 'support_task'
  syntax: string
  options: CommandOption[]
  examples: CommandUsage[]
  proves: string
  doesNotProve: string
  verification: 'SOURCE_VERIFIED' | 'LAB_VERIFIED' | 'INTERNAL_SOP_REQUIRED' | 'PENDING'
  sourceUrls: string[]
  task?: SupportTask
}
// Legacy fields remain for Guided/Practice links and existing import/export data.
export type CommandDoc = { id: string; family: string; command: string; purpose: string; context: string; safety: 'read' | 'privileged_read' | 'change'; privilege: string; flags: string; centos: string; ubuntu: string; exampleOutput: string; interpretation: string; whenToUse: string; followUp: string; relatedTicketIds: string[]; pitfalls: string; knowledge?: CommandKnowledge }
