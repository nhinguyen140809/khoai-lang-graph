import { runModuleKeys } from './run-module.keys'

/** The query keys of the runs, from the widest to the narrowest. */
export const runKeys = {
  /** Every query of the runs, not of their steps, state or directives: see `runModuleKeys.all()`. */
  all: () => [...runModuleKeys.all(), 'runs'] as const,
  /** The start of the key of every list of runs, to load them all again after a change. */
  lists: () => [...runKeys.all(), 'list'] as const,
  /** The runs of one thread. */
  ofThread: (threadId: string) => [...runKeys.lists(), threadId] as const,
  /** The newest run of one thread. */
  latestOfThread: (threadId: string) => [...runKeys.all(), 'latest', threadId] as const,
  /** One run. */
  detail: (runId: string) => [...runKeys.all(), 'detail', runId] as const,
}
