import type { Message } from '@/modules/thread/entities'

import { artifactFixtureByKind, itemFixtureByKey } from '../artifacts/fixtures/artifacts.fixtures'
import { buildStepId } from '../runs/fixtures/runs.fixtures'
import { IdPrefix, mockId, projectIds, runIds, threadIds } from '../shared/db'

// Mock messages. The chat of the mentor platform follows the runs of the API examples: the first
// message started run 1, the validator answered in run 1, a second message started run 2, and a
// third was taken in by run 3 while it ran. The other projects have their first message only,
// except the campus thread, which also holds a message that no run has taken in yet.

function message(
  fields: Partial<Message> & Pick<Message, 'id' | 'thread_id' | 'sequence' | 'created_at'>,
): Message {
  return {
    run_id: null,
    author: 'user',
    agent_role: null,
    content: '',
    artifact_refs: [],
    item_refs: [],
    delivery: null,
    delivered_in_step_id: null,
    ...fields,
  }
}

/** A message of the mock data with the usual fields; `fields` change what differs. */
export const buildMessage = message

/** Every message of the mock data, in the order they were sent. */
export const messageFixtures: Message[] = [
  message({
    id: mockId(IdPrefix.Message, 1),
    thread_id: threadIds.mentorMain,
    sequence: 1,
    run_id: runIds.mentorMain1,
    content: 'I want to build an online platform for university students to find mentors.',
    delivery: 'started_run',
    created_at: '2026-10-02T08:10:00Z',
  }),
  message({
    id: mockId(IdPrefix.Message, 2),
    thread_id: threadIds.campusMain,
    sequence: 1,
    run_id: runIds.campusMain1,
    content: 'Students order food from the campus canteens and pick it up.',
    delivery: 'started_run',
    created_at: '2026-10-05T15:49:30Z',
  }),
  message({
    id: mockId(IdPrefix.Message, 3),
    thread_id: threadIds.libraryMain,
    sequence: 1,
    run_id: runIds.libraryMain1,
    content: 'A system to book study rooms and desks in the library.',
    delivery: 'started_run',
    created_at: '2026-10-03T10:09:30Z',
  }),
  message({
    id: mockId(IdPrefix.Message, 4),
    thread_id: threadIds.laundryMain,
    sequence: 1,
    run_id: runIds.laundryMain1,
    content: 'Dorm residents book washing machines by the hour.',
    delivery: 'started_run',
    created_at: '2026-09-20T08:39:00Z',
  }),
  message({
    id: mockId(IdPrefix.Message, 5),
    thread_id: threadIds.mentorMain,
    sequence: 2,
    run_id: runIds.mentorMain1,
    author: 'agent',
    agent_role: 'validator',
    content:
      'The specification is ready: **18 requirements** in 4 sections, from finding a mentor to paying for a session.',
    created_at: '2026-10-02T08:52:41Z',
  }),
  message({
    id: mockId(IdPrefix.Message, 6),
    thread_id: threadIds.mentorMain,
    sequence: 3,
    run_id: runIds.mentorMain2,
    content: 'Group sessions are needed too: several students book one session of a mentor.',
    delivery: 'started_run',
    created_at: '2026-10-04T10:00:00Z',
  }),
  message({
    id: mockId(IdPrefix.Message, 7),
    thread_id: threadIds.mentorMain,
    sequence: 4,
    run_id: runIds.mentorMain3,
    content: 'Also ask the mentors how they want to be paid.',
    delivery: 'delivered',
    delivered_in_step_id: buildStepId(3, 4),
    created_at: '2026-10-06T08:30:40Z',
  }),
  message({
    id: mockId(IdPrefix.Message, 8),
    thread_id: threadIds.mentorMain,
    sequence: 5,
    run_id: runIds.mentorMain3,
    author: 'agent',
    agent_role: 'analyst',
    content:
      'I read all three interviews and found **one conflict**: the student and the admin disagree on who approves a booking. It needs your call when you review the analysis.',
    artifact_refs: [artifactRefOf('requirements_analysis', 4)],
    item_refs: [itemRefOf('CONF-001')],
    created_at: '2026-10-06T08:41:00Z',
  }),
  message({
    id: mockId(IdPrefix.Message, 9),
    thread_id: threadIds.mentorMain,
    sequence: 6,
    run_id: runIds.mentorMain3,
    content: 'Also ask about group sessions.',
    delivery: 'pending',
    created_at: '2026-10-06T08:42:00Z',
  }),
  // The run of the campus thread ended; this message waits for the run it will start.
  message({
    id: mockId(IdPrefix.Message, 10),
    thread_id: threadIds.campusMain,
    sequence: 2,
    run_id: null,
    content: 'Let a group of students order and pay together.',
    delivery: null,
    created_at: '2026-10-05T16:25:00Z',
  }),
]

// The references of the message of the analyst, at the versions the mock data holds.
function artifactRefOf(kind: string, version: number): Message['artifact_refs'][number] {
  const artifact = artifactFixtureByKind(projectIds.mentor, kind)
  return {
    artifact_id: artifact.id,
    kind: artifact.kind,
    title: artifact.title,
    version,
  }
}

function itemRefOf(key: string): Message['item_refs'][number] {
  const item = itemFixtureByKey(projectIds.mentor, key)
  return { item_id: item.id, kind: item.kind, key, version: item.version }
}
