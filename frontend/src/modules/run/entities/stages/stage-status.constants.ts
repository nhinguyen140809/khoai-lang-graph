import type { Wording } from '@/shared/lib/view'

import type { StageStatus } from './stage-progress.types'

/** The label of each status of a stage or a subject in each view, as Progress reads it after the title. */
export const stageStatusLabels = {
  not_started: { developer: 'Not started', user: 'Not started' },
  running: { developer: 'Running', user: 'In progress' },
  waiting: { developer: 'Waiting for review', user: 'Waiting for you' },
  done: { developer: 'Done', user: 'Done' },
  failed: { developer: 'Failed', user: 'Failed' },
  stopped: { developer: 'Cancelled', user: 'Stopped' },
} as const satisfies Record<StageStatus, Wording>
