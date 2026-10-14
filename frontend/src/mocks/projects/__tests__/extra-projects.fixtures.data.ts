import { mockRuns } from '../../runs/runs.fixtures'
import { mockThreads } from '../../threads/threads.fixtures'
import { extraProjects, extraRuns, extraThreads } from '../extra-projects.fixtures'
import { mockProjects } from '../projects.fixtures'

/** The ids of each kind of record: those of the fixtures, then those of the extra projects. */
export const recordIdCases = [
  { records: 'projects', ids: [...mockProjects, ...extraProjects()].map(({ id }) => id) },
  { records: 'threads', ids: [...mockThreads('waiting'), ...extraThreads()].map(({ id }) => id) },
  { records: 'runs', ids: [...mockRuns('waiting'), ...extraRuns()].map(({ id }) => id) },
]

/** Each extra project, by name. */
export const extraProjectCases = extraProjects().map(({ id, name }) => ({ name, projectId: id }))

/** A state of a run, and the status of its last step. */
export const lastStepCases = [
  { runStatus: 'running', stepStatus: 'running' },
  { runStatus: 'interrupted', stepStatus: 'running' },
  { runStatus: 'failed', stepStatus: 'failed' },
]
