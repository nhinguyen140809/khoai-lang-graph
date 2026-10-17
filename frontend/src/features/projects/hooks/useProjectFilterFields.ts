import { useMemo } from 'react'

import type { FilterField } from '@/shared/components/filter'
import { runStatusLabel } from '@/shared/domain/run-status'
import { useView } from '@/shared/hooks/useView'

import {
  lastActivityPeriods,
  projectFilterKeys,
  projectFilterMessages,
  projectRunFilters,
} from '../constants/project-filters.constants'

/**
 * The filters of the project list: the status of a project, in the view of the app, any number of
 * them, and one period of its last activity.
 */
export function useProjectFilterFields(): FilterField[] {
  const view = useView()

  return useMemo(
    () => [
      {
        key: projectFilterKeys.runStatus,
        label: projectFilterMessages.runStatus,
        choose: 'many',
        options: projectRunFilters.map((value) => ({
          value,
          label: runStatusLabel(value === 'none' ? null : value)[view],
        })),
      },
      {
        key: projectFilterKeys.lastActivity,
        label: projectFilterMessages.lastActivity,
        choose: 'one',
        options: lastActivityPeriods.map(({ days, label }) => ({ value: String(days), label })),
      },
    ],
    [view],
  )
}
