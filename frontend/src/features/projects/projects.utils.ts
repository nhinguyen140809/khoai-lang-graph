import type { FilterValues } from '@/shared/components/filter'

import { projectFilterKeys, projectRunFilters } from './constants/project-filters.constants'
import type { Project, ProjectFilters, ProjectRunFilter } from './projects.types'

const UNTITLED = 'Untitled project'

/** The name of a project as the pages show it, also while the agents have not named it yet. */
export function projectName(project: Pick<Project, 'name'>): string {
  return project.name ?? UNTITLED
}

/** How many runs of a project are not finished: about to start, running or waiting for review. */
export function unfinishedRunCount(project: Pick<Project, 'unfinished_run_counts'>): number {
  const { queued, running, interrupted } = project.unfinished_run_counts
  return queued + running + interrupted
}

/** The filters of a list of projects that narrow nothing. */
export const noProjectFilters: ProjectFilters = { runStatuses: [], activeWithinDays: null }

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
