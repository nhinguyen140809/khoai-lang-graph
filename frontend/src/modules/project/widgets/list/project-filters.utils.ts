import type { ProjectFilters, ProjectRunFilter } from '@/modules/project/entities'
import type { FilterValues } from '@/shared/components/filter'

import { projectFilterKeys, projectRunFilters } from './project-filters.constants'

function isProjectRunFilter(value: string): value is ProjectRunFilter {
  return (projectRunFilters as readonly string[]).includes(value)
}

/** The filters of the project list from the values chosen in its filters. */
export function projectFiltersOf(values: FilterValues): ProjectFilters {
  const [days] = values[projectFilterKeys.lastActivity] ?? []
  return {
    runStatuses: (values[projectFilterKeys.runStatus] ?? []).filter(isProjectRunFilter),
    activeWithinDays: days === undefined ? null : Number(days),
  }
}

/** Whether the filters narrow the list. */
export function isFiltered(filters: ProjectFilters): boolean {
  return filters.runStatuses.length > 0 || filters.activeWithinDays !== null
}
