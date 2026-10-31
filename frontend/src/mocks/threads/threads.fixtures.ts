import type { Thread } from '@/modules/thread/entities'

import { projectIds, threadIds, userId } from '../shared/db'

// Mock threads. Every project has one thread; the thread of the mentor platform holds the runs of
// the API examples, so its stage and its runs follow the `mock-run-status` scenario. The run
// fields of a thread are read from its runs, not held here.

function thread(fields: Partial<Thread> & Pick<Thread, 'id' | 'project_id'>): Thread {
  return {
    created_by: userId,
    title: 'Main thread',
    status: 'active',
    current_stage: null,
    active_run_id: null,
    latest_run_status: null,
    last_message_at: '2026-10-01T09:00:00Z',
    created_at: '2026-10-01T09:00:00Z',
    updated_at: '2026-10-01T09:00:00Z',
    ...fields,
  }
}

/** A thread of the mock data with the usual fields; `fields` change what differs. */
export const buildThread = thread

/** Every thread of the mock data. */
export const threadFixtures: Thread[] = [
  thread({
    id: threadIds.mentorMain,
    project_id: projectIds.mentor,
    last_message_at: '2026-10-06T08:41:12Z',
    created_at: '2026-10-02T08:09:30Z',
    updated_at: '2026-10-06T08:41:12Z',
  }),
  thread({
    id: threadIds.campusMain,
    project_id: projectIds.campus,
    last_message_at: '2026-10-05T16:20:00Z',
    created_at: '2026-10-05T15:49:30Z',
    updated_at: '2026-10-05T16:20:00Z',
  }),
  thread({
    id: threadIds.libraryMain,
    project_id: projectIds.library,
    last_message_at: '2026-10-03T10:12:00Z',
    created_at: '2026-10-03T10:09:30Z',
    updated_at: '2026-10-03T10:12:00Z',
  }),
  thread({
    id: threadIds.laundryMain,
    project_id: projectIds.laundry,
    last_message_at: '2026-09-20T09:00:00Z',
    created_at: '2026-09-20T08:39:00Z',
    updated_at: '2026-09-20T09:00:00Z',
  }),
]
