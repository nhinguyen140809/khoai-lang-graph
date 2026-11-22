import { useInfiniteQuery } from '@tanstack/react-query'

import { cursorPagesOptions } from '@/shared/api/query-client'

import { listProjectSources } from '../sources.api'
import { sourcesPageSize } from '../sources.constants'
import { sourceKeys } from '../sources.keys'

/** The sources of a project, newest first, a page at a time. */
export function useProjectSources(projectId: string) {
  return useInfiniteQuery({
    queryKey: sourceKeys.list(projectId),
    queryFn: ({ pageParam }) => listProjectSources(projectId, pageParam, sourcesPageSize),
    ...cursorPagesOptions,
  })
}
