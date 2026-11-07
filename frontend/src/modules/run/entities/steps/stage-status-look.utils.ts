import type { Wording } from '@/shared/lib/view'

import type { WorkStatus } from './run-steps.types'
import type { StageStatus } from './stage-progress.types'
import { stageStatusLabels } from './stage-status.constants'
import { stageStatusLooks, workStatusLooks } from './stage-status-look.constants'

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

/** Whether a line of work is in progress. */
export function isWorkStatusInProgress(status: WorkStatus): boolean {
  return workStatusLook(status).isLoading
}

/** How a status of a line of work shows. */
export function workStatusLook(status: WorkStatus) {
  return workStatusLooks[status]
}
