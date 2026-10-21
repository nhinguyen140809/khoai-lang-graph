import type { Thread } from '@/modules/thread/entities'

import { projectIds, runIds, threadIds, userId } from '../shared/mock-ids.constants'
import type { MockRunState } from '../shared/mock-scenario.types'

// Mock threads. Every project has one thread; the thread of the mentor platform holds the run of
// the API examples, so its stage and its unfinished run follow the `mock-run-state` scenario.

function thread(fields: Partial<Thread> & Pick<Thread, 'id' | 'project_id'>): Thread {
  return {
    created_by: userId,
    title: 'Main thread',
    status: 'active',
    current_stage: 'done',
    active_run_id: null,
    active_run_status: null,
    last_message_at: '2026-10-01T09:00:00Z',
    created_at: '2026-10-01T09:00:00Z',
    updated_at: '2026-10-01T09:00:00Z',
    ...fields,
  }
}

/** A thread of the mock data with the usual fields; `fields` change what differs. */
export const buildMockThread = thread

const mentorMainStages = {
  running: {
    current_stage: 'analysis',
    active_run_id: runIds.mentorMain3,
    active_run_status: 'running',
  },
  waiting: {
    current_stage: 'analysis_review',
    active_run_id: runIds.mentorMain3,
    active_run_status: 'interrupted',
  },
  failed: { current_stage: 'analysis', active_run_id: null, active_run_status: null },
  done: { current_stage: 'done', active_run_id: null, active_run_status: null },
} as const satisfies Record<
  MockRunState,
  Pick<Thread, 'current_stage' | 'active_run_id' | 'active_run_status'>
>

/** Every thread of the mock data, newest message first. */
export function mockThreads(state: MockRunState): Thread[] {
  return [
    thread({
      id: threadIds.mentorMain,
      project_id: projectIds.mentor,
      ...mentorMainStages[state],
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
      current_stage: 'interviewing',
      active_run_id: runIds.libraryMain1,
      active_run_status: 'running',
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
}

/** The threads as they are before any run: no stage and no unfinished run. */
export function withoutRuns(threads: Thread[]): Thread[] {
  return threads.map((item) => ({
    ...item,
    current_stage: null,
    active_run_id: null,
    active_run_status: null,
  }))
}
