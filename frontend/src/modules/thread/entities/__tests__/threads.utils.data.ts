import { buildMockThread } from '@/mocks/threads/threads.fixtures'
import type { RunStatus } from '@/modules/run/entities/@x/thread'

function thread(id: string, latestRunStatus: RunStatus | null) {
  return buildMockThread({ id, project_id: 'p1', latest_run_status: latestRunStatus })
}

/** The threads of a project, the latest message first, and their ids from the one that needs the user most. */
export const byAttentionCases = [
  {
    name: 'a review that waits before a failed run with a newer message',
    threads: [thread('t1', 'failed'), thread('t2', 'interrupted')],
    order: ['t2', 't1'],
  },
  {
    name: 'a failed run before a run that works',
    threads: [thread('t1', 'running'), thread('t2', 'failed')],
    order: ['t2', 't1'],
  },
  {
    name: 'threads of one status in the order of their messages',
    threads: [thread('t1', 'succeeded'), thread('t2', 'succeeded')],
    order: ['t1', 't2'],
  },
  {
    name: 'a thread without a run after a stopped run',
    threads: [thread('t1', null), thread('t2', 'cancelled')],
    order: ['t2', 't1'],
  },
  { name: 'no thread', threads: [], order: [] },
]
