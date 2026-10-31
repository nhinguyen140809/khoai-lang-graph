import type { Project } from './projects.types'

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
