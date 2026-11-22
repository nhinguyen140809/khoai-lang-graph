import type { Wording } from '@/shared/lib/view'

import type { StageStatus } from './stage-progress.types'

/** The label of each status of a stage or a subject in each view, as Progress reads it after the title. */
export const stageStatusLabels = {
  not_started: { developer: 'Not started' },
  running: { developer: 'In progress' },
  waiting: { developer: 'Waiting for you' },
  done: { developer: 'Done' },
  failed: { developer: 'Failed' },
  stopped: { developer: 'Stopped' },
} as const satisfies Record<StageStatus, Wording>
