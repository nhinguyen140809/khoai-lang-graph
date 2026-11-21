import { type RunStatus } from '@/modules/run/entities/@x/project'
import { hasTextPart } from '@/shared/lib/text'

import { projectMessages } from './projects.constants'
import type { Project, ProjectStatus } from './projects.types'

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

/** The projects whose name holds the search, whatever its case and accents; all of them for no search. */
export function projectsMatching<P extends Pick<Project, 'name'>>(
  projects: readonly P[],
  search: string,
): readonly P[] {
  const part = search.trim()
  if (part === '') return projects
  return projects.filter((project) => hasTextPart(projectName(project), part))
}

/** What a list without a project to show says: that the search matches none, or that it has none. */
export function emptyProjectListMessage(status: ProjectStatus, search: string): string {
  if (search.trim() !== '') return projectMessages.noMatch
  return status === 'archived' ? projectMessages.noArchived : projectMessages.none
}

/** Whether the activity of a project is later than the last one seen; false when none was seen yet. */
export function hasNews(seenAt: string | undefined, activityAt: string): boolean {
  return seenAt !== undefined && activityAt > seenAt
}

/** The statuses that a list of projects shows: the ones that ask for the user, or work. */
const noticeableStatuses: ReadonlySet<RunStatus> = new Set(['interrupted', 'failed', 'running'])

/**
 * The status that a project shows in a list: one that asks for the user or works. A run that is
 * done or stopped, and a project without a run, show none.
 */
export function noticeableRunStatus(status: RunStatus | null): RunStatus | null {
  return status !== null && noticeableStatuses.has(status) ? status : null
}
