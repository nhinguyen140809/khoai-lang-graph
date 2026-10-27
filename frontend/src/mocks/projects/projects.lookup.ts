import type { Project } from '@/modules/project/entities'
import { isUnfinishedRunStatus, type Run } from '@/modules/run/entities'

import { generatedProjects, manyProjects } from '../generated/fixtures/generated-projects.fixtures'
import { manyProjectCount } from '../generated/generated.constants'
import { allRuns } from '../runs/runs.lookup'
import { pageUrlParam } from '../shared/scenario'
import { projectFixtures } from './projects.fixtures'
import { createdProjects, deletedProjectIds, projectEdits } from './projects.store'
import { rollupRunStatus } from './run-status-rollup.utils'

// The projects as the mock server holds them now: the fixtures, the projects created since, and
// what changed in them.

// The unfinished runs of a project, counted by status, and the status of its latest run, as the
// API derives them. A run that has not started yet is the latest.
function withRunCounts(project: Project, runs: Run[]): Project {
  const counts: Project['unfinished_run_counts'] = { queued: 0, running: 0, interrupted: 0 }
  const own = runs.filter((run) => run.project_id === project.id)
  for (const run of own) {
    if (isUnfinishedRunStatus(run.status)) counts[run.status] += 1
  }
  // The latest run of each thread: a run that a later run of its thread replaced no longer counts.
  const latestOfThread = new Map<string, Run>()
  for (const run of own) {
    const latest = latestOfThread.get(run.thread_id)
    if (latest === undefined || run.number > latest.number) latestOfThread.set(run.thread_id, run)
  }
  return {
    ...project,
    unfinished_run_counts: counts,
    rollup_run_status: rollupRunStatus([...latestOfThread.values()].map(({ status }) => status)),
  }
}

// The values of `mock-projects` that make the list long: the projects of the fixtures, and many
// more. With `more-loading`, a page after the first never answers.
const longListScenarios = ['many', 'more-loading']

export function allProjects(): Project[] {
  const isLong = longListScenarios.includes(pageUrlParam('mock-projects') ?? '')
  const many = isLong ? manyProjects(manyProjectCount) : []
  const runs = allRuns()
  const changes = projectEdits.get()
  const deleted = deletedProjectIds.get()
  return [...createdProjects.get(), ...projectFixtures, ...generatedProjects(), ...many]
    .filter(({ id }) => !deleted.includes(id))
    .map((project) => withRunCounts({ ...project, ...changes[project.id] }, runs))
}

/** A project of the fixtures or one created since. */
export function findProject(projectId: string): Project | undefined {
  return allProjects().find(({ id }) => id === projectId)
}

/** Changes a project of the fixtures or one created since; a project that is not found stays so. */
export function changeProject(projectId: string, change: (project: Project) => Partial<Project>) {
  const project = findProject(projectId)
  if (project === undefined) return
  const changes = projectEdits.get()
  projectEdits.set({ ...changes, [projectId]: { ...changes[projectId], ...change(project) } })
}
