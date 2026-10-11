import type { Message } from '@/features/console'

import { RUN_IDS, stepId, THREAD_IDS } from './mock-ids.constants'

// Mock messages. The console of the mentor platform follows the runs of the API examples:
// the first message started run 1, a second one started run 2, and a third was read by run 3
// while it ran. The other projects have their first message only.

function message(fields: Partial<Message> & Pick<Message, 'id' | 'thread_id' | 'created_at'>) {
  return {
    sequence: 1,
    run_id: null,
    author: 'user',
    agent_role: null,
    content: '',
    delivery: null,
    delivered_in_step_id: null,
    ...fields,
  } satisfies Message
}

const messageId = (n: number) => `c2a10000-0000-4000-8000-${String(n).padStart(12, '0')}`

/** Every message of the mock data, oldest first. */
export const mockMessages: Message[] = [
  message({
    id: messageId(1),
    thread_id: THREAD_IDS.mentorMain,
    sequence: 1,
    run_id: RUN_IDS.mentorMain1,
    content: 'I want to build an online platform for university students to find mentors.',
    delivery: 'started_run',
    created_at: '2026-10-02T08:10:00Z',
  }),
  message({
    id: messageId(2),
    thread_id: THREAD_IDS.mentorMain,
    sequence: 2,
    run_id: RUN_IDS.mentorMain1,
    author: 'agent',
    agent_role: 'validator',
    content:
      'The requirement specification is ready: **18 requirements** in 4 sections. See REQ-001 first.',
    created_at: '2026-10-02T08:52:41Z',
  }),
  message({
    id: messageId(3),
    thread_id: THREAD_IDS.mentorMain,
    sequence: 3,
    run_id: RUN_IDS.mentorMain2,
    content: 'Group sessions are needed too: several students book one session of a mentor.',
    delivery: 'started_run',
    created_at: '2026-10-04T10:00:00Z',
  }),
  message({
    id: messageId(4),
    thread_id: THREAD_IDS.mentorMain,
    sequence: 4,
    run_id: RUN_IDS.mentorMain3,
    content: 'Also ask the mentors how they want to be paid.',
    delivery: 'delivered',
    delivered_in_step_id: stepId(3, 4),
    created_at: '2026-10-06T08:30:40Z',
  }),
  message({
    id: messageId(5),
    thread_id: THREAD_IDS.campusMain,
    run_id: RUN_IDS.campusMain1,
    content: 'Students order food from the campus canteens and pick it up.',
    delivery: 'started_run',
    created_at: '2026-10-05T15:49:30Z',
  }),
  message({
    id: messageId(6),
    thread_id: THREAD_IDS.libraryMain,
    run_id: RUN_IDS.libraryMain1,
    content: 'A system to book study rooms and desks in the library.',
    delivery: 'started_run',
    created_at: '2026-10-03T10:09:30Z',
  }),
  message({
    id: messageId(7),
    thread_id: THREAD_IDS.laundryMain,
    run_id: RUN_IDS.laundryMain1,
    content: 'Dorm residents book washing machines by the hour.',
    delivery: 'started_run',
    created_at: '2026-09-20T08:39:00Z',
  }),
]
