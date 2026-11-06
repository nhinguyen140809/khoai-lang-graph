import type { Wording } from '@/shared/lib/view'

import type { StageStatus } from './stage-progress.types'
import { stageStatusLabels } from './stage-status.constants'
import { stageStatusLooks } from './stage-status-look.constants'

/** How a status of a stage or of a subject shows. */
export function stageStatusLook(status: StageStatus) {
  return stageStatusLooks[status]
}

/** The label of a status of a stage or of a subject. */
export function stageStatusLabel(status: StageStatus): Wording {
  return stageStatusLabels[status]
}

/** Whether the status of a stage is in progress: running, or waiting for the user. */
export function isStageStatusInProgress(status: StageStatus): boolean {
  const look = stageStatusLook(status)
  return look.isLoading || look.isWaiting
}

/** Whether the status of a stage is done. */
export function isStageStatusCompleted(status: StageStatus): boolean {
  return stageStatusLook(status).isCompleted
}
