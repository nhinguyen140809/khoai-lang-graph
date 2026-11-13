import { buildRun } from '@/mocks/runs/fixtures/runs.fixtures'
import type { Run, RunStatus } from '@/modules/run/entities'

/** A run of the given status, the one that the tests of Retry act on. */
export function runWith(status: RunStatus): Run {
  return buildRun({ id: 'r1', thread_id: 't1', project_id: 'p1', number: 1, status })
}
