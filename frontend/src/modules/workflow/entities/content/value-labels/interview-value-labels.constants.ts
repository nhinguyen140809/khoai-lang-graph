import type { Wording } from '@/shared/lib/view'

/** How far a persona is in its interview, in each view. */
export const personaInterviewStatusLabels = {
  not_started: { developer: 'Not interviewed' },
  in_progress: { developer: 'Interview in progress' },
  completed: { developer: 'Interviewed' },
} as const satisfies Record<string, Wording>

/** Whether an interview still runs, in each view. */
export const transcriptStatusLabels = {
  in_progress: { developer: 'In progress' },
  completed: { developer: 'Completed' },
} as const satisfies Record<string, Wording>

/** Why an interview ended, in each view. */
export const stopReasonLabels = {
  max_turns: { developer: 'Turn limit reached' },
  interviewer_stopped: { developer: 'Ended by the interviewer' },
  stopping_condition_met: { developer: 'Stopping condition reached' },
} as const satisfies Record<string, Wording>
