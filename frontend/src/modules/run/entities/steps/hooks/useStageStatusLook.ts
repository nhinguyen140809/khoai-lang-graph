'use client'

import { useWording } from '@/shared/lib/view'

import type { StageStatus } from '../stage-progress.types'
import { stageStatusLabel, stageStatusLook } from '../stage-status-look.utils'

/** How a status of a stage or of a subject shows, with its label in the view of the app. */
export function useStageStatusLook(status: StageStatus) {
  const label = useWording(stageStatusLabel(status))
  return { ...stageStatusLook(status), label }
}
