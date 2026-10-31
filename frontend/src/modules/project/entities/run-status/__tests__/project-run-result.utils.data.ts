import { buildRun } from '@/mocks/runs/fixtures/runs.fixtures'

import type { ProjectRunResult } from '../project-run-result.types'

const run = buildRun({
  id: 'r1',
  thread_id: 't1',
  project_id: 'p1',
  number: 1,
  status: 'running',
})

/** The status of a project, and the run it shows. */
export const shownRunCases: {
  name: string
  project: ProjectRunResult
  shown: typeof run | null
}[] = [
  { name: 'a status that loads', project: { state: 'pending' }, shown: null },
  {
    name: 'a status that fails to load',
    project: { state: 'error', retry: () => undefined },
    shown: null,
  },
  {
    name: 'a project before its first run',
    project: { state: 'success', run: null, threads: [] },
    shown: null,
  },
  { name: 'a project with a run', project: { state: 'success', run, threads: [] }, shown: run },
]
