import { runModuleKeys } from '../runs/run-module.keys'

/** The query keys of the directives of the runs, from the widest to the narrowest. */
export const directiveKeys = {
  all: () => [...runModuleKeys.all(), 'directives'] as const,
  /** The directives of one run. */
  ofRun: (runId: string) => [...directiveKeys.all(), runId] as const,
}
