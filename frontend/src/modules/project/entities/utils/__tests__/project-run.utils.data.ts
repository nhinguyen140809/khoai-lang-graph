import { buildMockRun } from '@/mocks/runs/runs.fixtures'

import type { ProjectRun } from '../../types/project-run.types'

const run = buildMockRun({
  id: 'r1',
  thread_id: 't1',
  project_id: 'p1',
  number: 1,
  status: 'running',
})

/** The status of a project, and the run it shows. */
export const shownRunCases: { name: string; project: ProjectRun; shown: typeof run | null }[] = [
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
