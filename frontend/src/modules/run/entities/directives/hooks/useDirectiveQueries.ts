import { useInfiniteQuery } from '@tanstack/react-query'

import { cursorPagesOptions, type HookQueryOptions } from '@/shared/api/query-client'

import { listRunDirectives } from '../directives.api'
import { directivesPageSize } from '../directives.constants'
import { directiveKeys } from '../directives.keys'

/** The directives of a run, by the loop they start, a page at a time. */
export function useRunDirectives(runId: string, { isEnabled = true }: HookQueryOptions = {}) {
  return useInfiniteQuery({
    queryKey: directiveKeys.ofRun(runId),
    queryFn: ({ pageParam }) => listRunDirectives(runId, pageParam, directivesPageSize),
    ...cursorPagesOptions,
    enabled: isEnabled,
  })
}
