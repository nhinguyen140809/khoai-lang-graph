import { buildThread } from '@/mocks/threads/threads.fixtures'

import type { Thread } from '../threads.types'

export function threadWith(id: string, status: Thread['latest_run_status']): Thread {
  return buildThread({ id, project_id: 'p1', latest_run_status: status })
}

/**
 * Threads in the order given, and the ids of the same threads from the one that needs the user
 * most.
 */
export const attentionCases: { name: string; threads: Thread[]; ids: string[] }[] = [
  {
    name: 'each status in its place',
    threads: [
      threadWith('succeeded', 'succeeded'),
      threadWith('cancelled', 'cancelled'),
      threadWith('queued', 'queued'),
      threadWith('running', 'running'),
      threadWith('failed', 'failed'),
      threadWith('interrupted', 'interrupted'),
    ],
    ids: ['interrupted', 'failed', 'running', 'queued', 'cancelled', 'succeeded'],
  },
  {
    name: 'threads without a run last',
    threads: [threadWith('none', null), threadWith('done', 'succeeded')],
    ids: ['done', 'none'],
  },
  {
    name: 'two threads of one status in their order',
    threads: [threadWith('second', 'running'), threadWith('first', 'running')],
    ids: ['second', 'first'],
  },
  { name: 'no thread', threads: [], ids: [] },
]

/** Threads, and the ids of those whose latest run has not finished. */
export const unfinishedCases: { name: string; threads: Thread[]; ids: string[] }[] = [
  {
    name: 'each status',
    threads: [
      threadWith('queued', 'queued'),
      threadWith('running', 'running'),
      threadWith('interrupted', 'interrupted'),
      threadWith('succeeded', 'succeeded'),
      threadWith('failed', 'failed'),
      threadWith('cancelled', 'cancelled'),
      threadWith('none', null),
    ],
    ids: ['queued', 'running', 'interrupted'],
  },
  { name: 'no thread', threads: [], ids: [] },
]
