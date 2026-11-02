import type { Wording } from '@/shared/lib/view'

/** How far a persona is in its interview, in each view. */
export const personaInterviewStatusLabels = {
  not_started: { developer: 'Not started', user: 'Not interviewed' },
  in_progress: { developer: 'In progress', user: 'Interview in progress' },
  completed: { developer: 'Completed', user: 'Interviewed' },
} as const satisfies Record<string, Wording>

/** Whether an interview still runs, in each view. */
export const transcriptStatusLabels = {
  in_progress: { developer: 'In progress', user: 'In progress' },
  completed: { developer: 'Completed', user: 'Completed' },
} as const satisfies Record<string, Wording>

/** Why an interview ended, in each view. */
export const stopReasonLabels = {
  max_turns: { developer: 'Max turns', user: 'Turn limit reached' },
  interviewer_stopped: { developer: 'Interviewer stopped', user: 'Ended by the interviewer' },
  stopping_condition_met: {
    developer: 'Stopping condition met',
    user: 'Stopping condition reached',
  },
} as const satisfies Record<string, Wording>

/** Who said a message of an interview, in each view. */
export const messageRoleLabels = {
  interviewer: { developer: 'Interviewer', user: 'Interviewer' },
  persona: { developer: 'Persona', user: 'Interviewee' },
} as const satisfies Record<string, Wording>
