import { runModuleKeys } from '../runs/run-module.keys'

/** The query keys of the steps of the runs, from the widest to the narrowest. */
export const runStepKeys = {
  all: () => [...runModuleKeys.all(), 'steps'] as const,
  /** The steps of one run. */
  ofRun: (runId: string) => [...runStepKeys.all(), runId] as const,
  /** The first page of the steps of a run that has ended, read once. */
  firstPageOfRun: (runId: string) => [...runStepKeys.ofRun(runId), 'first-page'] as const,
}
