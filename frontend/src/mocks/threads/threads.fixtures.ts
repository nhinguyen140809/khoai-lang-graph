import type { Thread } from '@/modules/thread/entities'

import { PROJECT_IDS, RUN_IDS, THREAD_IDS, USER_ID } from '../shared/mock-ids.constants'
import { type MockRunState } from '../shared/mock-scenario.utils'

// Mock threads. Every project has one thread, and the mentor platform a second one, whose only run
// was stopped. The main thread of the mentor platform holds the run of the API examples, so its
// stage and its unfinished run follow the `mock-run-state` scenario.

function thread(fields: Partial<Thread> & Pick<Thread, 'id' | 'project_id'>): Thread {
  return {
    created_by: USER_ID,
    title: 'Main thread',
    status: 'active',
    current_stage: 'done',
    active_run_id: null,
    latest_run_status: null,
    last_message_at: '2026-10-01T09:00:00Z',
    created_at: '2026-10-01T09:00:00Z',
    updated_at: '2026-10-01T09:00:00Z',
    ...fields,
  }
}

/** A thread of the mock data with the usual fields; `fields` change what differs. */
export const buildMockThread = thread

const mentorMainStages = {
  queued: {
    current_stage: 'planning',
    active_run_id: RUN_IDS.mentorMain3,
    latest_run_status: 'queued',
  },
  running: {
    current_stage: 'analysis',
    active_run_id: RUN_IDS.mentorMain3,
    latest_run_status: 'running',
  },
  waiting: {
    current_stage: 'analysis_review',
    active_run_id: RUN_IDS.mentorMain3,
    latest_run_status: 'interrupted',
  },
  failed: { current_stage: 'analysis', active_run_id: null, latest_run_status: 'failed' },
  done: { current_stage: 'done', active_run_id: null, latest_run_status: 'succeeded' },
} as const satisfies Record<
  MockRunState,
  Pick<Thread, 'current_stage' | 'active_run_id' | 'latest_run_status'>
>

/** Every thread of the mock data, newest message first. */
export function mockThreads(state: MockRunState): Thread[] {
  return [
    thread({
      id: THREAD_IDS.mentorMain,
      project_id: PROJECT_IDS.mentor,
      ...mentorMainStages[state],
      last_message_at: '2026-10-06T08:41:12Z',
      created_at: '2026-10-02T08:09:30Z',
      updated_at: '2026-10-06T08:41:12Z',
    }),
    thread({
      id: THREAD_IDS.campusMain,
      project_id: PROJECT_IDS.campus,
      latest_run_status: 'succeeded',
      last_message_at: '2026-10-05T16:20:00Z',
      created_at: '2026-10-05T15:49:30Z',
      updated_at: '2026-10-05T16:20:00Z',
    }),
    thread({
      id: THREAD_IDS.libraryMain,
      project_id: PROJECT_IDS.library,
      current_stage: 'interviewing',
      active_run_id: RUN_IDS.libraryMain1,
      latest_run_status: 'running',
      last_message_at: '2026-10-03T10:12:00Z',
      created_at: '2026-10-03T10:09:30Z',
      updated_at: '2026-10-03T10:12:00Z',
    }),
    thread({
      id: THREAD_IDS.mentorPricing,
      project_id: PROJECT_IDS.mentor,
      title: 'Pricing questions',
      current_stage: 'interviewing',
      latest_run_status: 'cancelled',
      last_message_at: '2026-10-04T14:05:00Z',
      created_at: '2026-10-04T13:40:00Z',
      updated_at: '2026-10-04T14:05:00Z',
    }),
    thread({
      id: THREAD_IDS.laundryMain,
      project_id: PROJECT_IDS.laundry,
      latest_run_status: 'succeeded',
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
    latest_run_status: null,
  }))
}
