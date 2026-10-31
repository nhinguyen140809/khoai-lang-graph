import type { Run } from '@/modules/run/entities'
import type { Thread } from '@/modules/thread/entities'

import { generatedThreads } from '../generated/fixtures/generated-projects.fixtures'
import { findUnfinishedRun, latestRunOfEachThread } from '../runs/lookup/runs.lookup'
import { threadFixtures } from './threads.fixtures'
import { createdThreads } from './threads.store'

// The threads as the mock server holds them now: the fixtures and the threads created since, each
// with the run fields that the runs of the mock server give it.

/** Every thread, the run fields of each one read from its runs. */
export function allThreads(): Thread[] {
  const latestRuns = latestRunOfEachThread()
  return [...createdThreads.get(), ...threadFixtures, ...generatedThreads()].map((thread) =>
    withRunsOfThread(thread, latestRuns.get(thread.id)),
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
