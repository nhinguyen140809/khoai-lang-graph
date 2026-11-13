import type { Run } from '../runs/runs.types'
import type { RunStep } from '../steps/run-steps.types'

/**
 * The stage a run is in: the stage of the step that is running now, since the stage that the run
 * itself names is set by the workflow between its steps and can name one that has been left; the
 * stage the run names when no step runs, such as while it waits for a review.
 */
export function stageOfRun(
  run: Pick<Run, 'current_stage'>,
  steps: readonly Pick<RunStep, 'stage' | 'status'>[] | undefined,
): string {
  return steps?.findLast(({ status }) => status === 'running')?.stage ?? run.current_stage
}
