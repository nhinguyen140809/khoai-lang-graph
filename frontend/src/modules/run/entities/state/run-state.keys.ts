import { runModuleKeys } from '../runs/run-module.keys'

/** The query keys of the workflow state of the runs, from the widest to the narrowest. */
export const runStateKeys = {
  all: () => [...runModuleKeys.all(), 'state'] as const,
  /** Every state of one run, to load them all again after a change. */
  ofRun: (runId: string) => [...runStateKeys.all(), runId] as const,
  /** The state of a run now. */
  current: (runId: string) => [...runStateKeys.ofRun(runId), 'current'] as const,
  /** The state of a run after one of its steps. */
  afterStep: (runId: string, stepId: string) =>
    [...runStateKeys.ofRun(runId), 'after-step', stepId] as const,
}
