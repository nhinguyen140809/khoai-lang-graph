import { traceModuleKeys } from '../trace-module.keys'
import type { TraceQuery } from './chains.types'

/** The query keys of the chains of items, from the widest to the narrowest. */
export const chainKeys = {
  all: () => [...traceModuleKeys.all(), 'chains'] as const,
  /** The chain of one item. */
  ofItem: (itemId: string, query: TraceQuery) =>
    [...chainKeys.all(), 'item', itemId, query] as const,
  /** The chains of all the items of one artifact. */
  ofArtifact: (artifactId: string, query: TraceQuery) =>
    [...chainKeys.all(), 'artifact', artifactId, query] as const,
}
