import { runModuleKeys } from '../runs/run-module.keys'

/** The query keys of the steps of the runs, from the widest to the narrowest. */
export const runStepKeys = {
  all: () => [...runModuleKeys.all(), 'steps'] as const,
  /** The steps of one run. */
  ofRun: (runId: string) => [...runStepKeys.all(), runId] as const,
}
