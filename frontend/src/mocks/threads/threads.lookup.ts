import type { Run, UnfinishedRunStatus } from '@/modules/run/entities'
import { isUnfinishedRunStatus } from '@/modules/run/entities'
import type { Thread } from '@/modules/thread/entities'

import { generatedThreads } from '../generated/fixtures/generated-projects.fixtures'
import { allRuns } from '../runs/runs.lookup'
import { mockRunStatus, mockScenario } from '../shared/scenario'
import { threadFixtures, threadsBeforeAnyRun } from './threads.fixtures'
import { createdThreads } from './threads.store'

// The threads as the mock server holds them now: the fixtures and the threads created since, with
// the run that each one has.

// With `?mock-runs=empty`, no thread has a run yet.
export function allThreads(): Thread[] {
  const threads = [
    ...createdThreads.get(),
    ...threadFixtures(mockRunStatus()),
    ...generatedThreads(),
  ]
  if (mockScenario('runs') === 'empty') return threadsBeforeAnyRun(threads)
  const runs = allRuns()
  return threads.map((thread) => withRunsOfThread(thread, runs))
}

function isUnfinishedRun(run: Run): run is Run & { status: UnfinishedRunStatus } {
  return isUnfinishedRunStatus(run.status)
}

// The unfinished run of a thread follows the runs: a run stopped while the mock server runs
// leaves its thread without one.
function withRunsOfThread(thread: Thread, runs: Run[]): Thread {
  const active = runs
    .filter((run) => run.thread_id === thread.id)
    .toSorted((a, b) => b.number - a.number)
    .find(isUnfinishedRun)
  if (active === undefined) {
    return { ...thread, active_run_id: null, active_run_status: null }
  }
  return {
    ...thread,
    current_stage: active.current_stage,
    active_run_id: active.id,
    active_run_status: active.status,
  }
}
