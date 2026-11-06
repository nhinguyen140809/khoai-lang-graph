'use client'

import { useWording } from '@/shared/lib/view'

import { workStatusLabels } from '../work.constants'
import type { WorkStatus } from '../work.types'
import { workStatusLook } from '../work-status-look.utils'

/** How a status of a line of work shows, with its label in the view of the app. */
export function useWorkStatusLook(status: WorkStatus) {
  const label = useWording(workStatusLabels[status])
  return { ...workStatusLook(status), label }
}
