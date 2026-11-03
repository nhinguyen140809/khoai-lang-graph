import { useInfiniteQuery } from '@tanstack/react-query'

import { cursorPagesOptions, type HookQueryOptions } from '@/shared/api/query-client'

import { listProjectTraceLinks } from '../api/trace-links.api'
import { traceLinksPageSize } from '../constants/page-sizes.constants'
import { evidencedBy } from '../constants/trace-links.constants'
import { traceLinkKeys } from '../keys/trace-links.keys'
import type { TraceLinkFilters } from '../types/trace-links.types'

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
 * with the quote. `isEnabled` waits until it is needed.
 */
export function useLinksCiting(projectId: string, itemId: string, options: HookQueryOptions = {}) {
  return useProjectTraceLinks(projectId, { linkType: evidencedBy, targetItemId: itemId }, options)
}
