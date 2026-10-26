import type { Run, RunStep } from '@/modules/run/entities'

import { generatedRuns, generatedRunSteps } from '../generated/fixtures/generated-projects.fixtures'
import { mockRunState, mockScenario } from '../shared/scenario/mock-scenario.utils'
import { runFixtures, runStepFixtures } from './runs.fixtures'
import { createdRuns, runEdits } from './runs.store'

// The runs and their steps as the mock server holds them now: the fixtures, the runs that messages
// started, and what changed in them.

/** The runs with the edits that stopping them made. */
function withRunEdits(runs: Run[]): Run[] {
  const edits = runEdits.get()
  return runs.map((run) => ({ ...run, ...edits[run.id] }))
}

// With `?mock-runs=empty`, no run exists.
export function allRuns(): Run[] {
  if (mockScenario('runs') === 'empty') return []
  return withRunEdits([...createdRuns.get(), ...runFixtures(mockRunState()), ...generatedRuns()])
}

export function findRun(runId: string): Run | undefined {
  return allRuns().find(({ id }) => id === runId)
}

/** The steps of a run of the fixtures. */
export function stepsOfRun(runId: string): RunStep[] {
  return generatedRunSteps(runId) ?? runStepFixtures(runId, mockRunState())
}
