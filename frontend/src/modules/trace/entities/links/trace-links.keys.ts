import { traceModuleKeys } from '../trace-module.keys'
import type { TraceLinkFilters } from './trace-links.types'

/** The query keys of the trace links of a project, from the widest to the narrowest. */
export const traceLinkKeys = {
  all: () => [...traceModuleKeys.all(), 'links'] as const,
  /** The start of the key of every list of links, to load them all again after a change. */
  lists: () => [...traceLinkKeys.all(), 'list'] as const,
  /** The links of one project, narrowed by the filters. */
  ofProject: (projectId: string, filters: TraceLinkFilters) =>
    [...traceLinkKeys.lists(), projectId, filters] as const,
}
