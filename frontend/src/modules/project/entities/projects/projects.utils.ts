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
