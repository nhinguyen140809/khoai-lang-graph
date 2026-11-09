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
  /** The first page of the items that a link may lead to, narrowed by the search; no kind names every kind. */
  targets: (projectId: string, filters: { kind: string | null; text: string }) =>
    [...traceLinkKeys.all(), 'targets', projectId, filters] as const,
}
