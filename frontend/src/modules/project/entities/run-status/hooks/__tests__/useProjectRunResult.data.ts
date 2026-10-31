import { buildRun } from '@/mocks/runs/fixtures/runs.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { buildThread } from '@/mocks/threads/threads.fixtures'
import type { Run } from '@/modules/run/entities/@x/project'
import type { Thread } from '@/modules/thread/entities/@x/project'

/** An empty page of the API. */
export const emptyPage = { items: [], next_cursor: null }

/** Two threads of the mentor project: the first works, the second waits for a review. */
export const twoThreads: Thread[] = [
  buildThread({ id: 'works', project_id: projectIds.mentor, latest_run_status: 'running' }),
  buildThread({ id: 'waits', project_id: projectIds.mentor, latest_run_status: 'interrupted' }),
]

/** The run that a thread shows as its latest, with the status that the thread holds. */
export function latestRunOf(thread: Thread): Run {
  return buildRun({
    id: `run-of-${thread.id}`,
    thread_id: thread.id,
    project_id: thread.project_id,
    number: 1,
    status: thread.latest_run_status ?? 'succeeded',
  })
}
