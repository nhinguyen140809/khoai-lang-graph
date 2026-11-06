import { useInfiniteQuery } from '@tanstack/react-query'

import { cursorPagesOptions, type HookQueryOptions } from '@/shared/api/query-client'

import { traceLinksPageSize } from '../page-sizes.constants'
import { listProjectTraceLinks } from '../trace-links.api'
import { evidencedBy } from '../trace-links.constants'
import { traceLinkKeys } from '../trace-links.keys'
import type { TraceLinkFilters } from '../trace-links.types'

/** The current links of a project, narrowed by the filters, a page at a time. */
export function useProjectTraceLinks(
  projectId: string,
  filters: TraceLinkFilters = {},
  { isEnabled = true }: HookQueryOptions = {},
) {
  return useInfiniteQuery({
    queryKey: traceLinkKeys.ofProject(projectId, filters),
    queryFn: ({ pageParam }) =>
      listProjectTraceLinks(projectId, pageParam, traceLinksPageSize, filters),
    ...cursorPagesOptions,
    enabled: isEnabled,
  })
}

/**
 * The links that cite an item, such as an interview message: the items taken from its words, each
 * with the words of their target. `isEnabled` waits until it is needed.
 */
export function useLinksCiting(projectId: string, itemId: string, options: HookQueryOptions = {}) {
  return useProjectTraceLinks(projectId, { linkType: evidencedBy, targetItemId: itemId }, options)
}
