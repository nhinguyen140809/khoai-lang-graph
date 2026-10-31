import type { Run } from '@/modules/run/entities'
import type { Message, Thread } from '@/modules/thread/entities'
import { newestOfEachGroup } from '@/shared/lib/collections'

import { generatedThreads } from '../generated/fixtures/generated-projects.fixtures'
import { allMessages } from '../messages/messages.lookup'
import { findUnfinishedRun, latestRunOfEachThread } from '../runs/lookup/runs.lookup'
import { threadFixtures } from './threads.fixtures'
import { createdThreads, deletedThreadIds, threadEdits } from './threads.store'

// The threads as the mock server holds them now: the fixtures and the threads created since, each
// with the changes of the mock server and the run fields that its runs give it.

/** Every thread, the run fields and the time of the newest message of each one read from its records. */
export function allThreads(): Thread[] {
  const edits = threadEdits.get()
  const deleted = deletedThreadIds.get()
  const latestRuns = latestRunOfEachThread()
  // The newest message of each thread, by sequence, read once for every thread together.
  const newestMessages = newestOfEachGroup(
    allMessages(),
    ({ thread_id: threadId }) => threadId,
    ({ sequence }) => sequence,
  )
  return [...createdThreads.get(), ...threadFixtures, ...generatedThreads()]
    .filter(({ id }) => !deleted.includes(id))
    .map((thread) =>
      withRunsOfThread(
        withLastMessageAt({ ...thread, ...edits[thread.id] }, newestMessages.get(thread.id)),
        latestRuns.get(thread.id),
      ),
    )
}

/** A thread of the fixtures or one created since. */
export function findThread(threadId: string): Thread | undefined {
  return allThreads().find(({ id }) => id === threadId)
}

// The stage and the status of the latest run of a thread, and its unfinished run: a run stopped
// while the mock server runs leaves its thread without one.
function withRunsOfThread(thread: Thread, latest: Run | undefined): Thread {
  const active = findUnfinishedRun(thread.id)
  return {
    ...thread,
    current_stage: latest?.current_stage ?? null,
    active_run_id: active?.id ?? null,
    latest_run_status: latest?.status ?? null,
  }
}

// The time of the newest message; the creation time while the thread has none.
function withLastMessageAt(thread: Thread, newest: Message | undefined): Thread {
  return { ...thread, last_message_at: newest?.created_at ?? thread.created_at }
}
