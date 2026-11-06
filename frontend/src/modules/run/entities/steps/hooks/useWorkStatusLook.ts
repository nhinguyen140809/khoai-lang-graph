'use client'

import { useWording } from '@/shared/lib/view'

import type { WorkStatus } from '../run-steps.types'
import { workStatusLook } from '../stage-status-look.utils'
import { workStatusLabels } from '../work.constants'

/** How a status of a line of work shows, with its label in the view of the app. */
export function useWorkStatusLook(status: WorkStatus) {
  const label = useWording(workStatusLabels[status])
  return { ...workStatusLook(status), label }
}
