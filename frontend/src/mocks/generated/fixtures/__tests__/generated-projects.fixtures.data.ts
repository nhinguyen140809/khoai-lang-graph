import { projectFixtures } from '../../../projects/projects.fixtures'
import { runFixtures } from '../../../runs/fixtures/runs.fixtures'
import { threadFixtures } from '../../../threads/threads.fixtures'
import { generatedProjects, generatedRuns, generatedThreads } from '../generated-projects.fixtures'

/** The ids of each kind of record: those of the fixtures, then those of the extra projects. */
export const recordIdCases = [
  { records: 'projects', ids: [...projectFixtures, ...generatedProjects()].map(({ id }) => id) },
  {
    records: 'threads',
    ids: [...threadFixtures('waiting'), ...generatedThreads()].map(({ id }) => id),
  },
  { records: 'runs', ids: [...runFixtures('waiting'), ...generatedRuns()].map(({ id }) => id) },
]

/** Each extra project, by name. */
export const extraProjectCases = generatedProjects().map(({ id, name }) => ({
  name,
  projectId: id,
}))

/** A state of a run, and the status of its last step. */
export const lastStepCases = [
  { runStatus: 'running', stepStatus: 'running' },
  { runStatus: 'interrupted', stepStatus: 'running' },
  { runStatus: 'failed', stepStatus: 'failed' },
]
