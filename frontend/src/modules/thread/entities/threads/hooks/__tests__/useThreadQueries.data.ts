import { buildThread } from '@/mocks/threads/threads.fixtures'

import type { Thread } from '../../threads.types'

export function threadWith(id: string, status: Thread['latest_run_status']): Thread {
  return buildThread({ id, project_id: 'p1', latest_run_status: status })
}

/** The status that a thread shows, the status of its run, and whether the threads load again. */
export const reloadCases: {
  name: string
  shown: Thread['latest_run_status']
  status: NonNullable<Thread['latest_run_status']>
  reloads: boolean
}[] = [
  { name: 'a run that ends', shown: 'running', status: 'succeeded', reloads: true },
  { name: 'a run that starts', shown: null, status: 'queued', reloads: true },
  {
    name: 'a run that goes on after a review',
    shown: 'interrupted',
    status: 'running',
    reloads: true,
  },
  {
    name: 'a run whose status is shown',
    shown: 'interrupted',
    status: 'interrupted',
    reloads: false,
  },
]
