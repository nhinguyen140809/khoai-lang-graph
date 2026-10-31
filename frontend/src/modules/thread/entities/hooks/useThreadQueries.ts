import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { refetchIntervalOf } from '@/modules/run/entities/@x/thread'
import { cursorPagesOptions, type HookQueryOptions } from '@/shared/api/query-client'

import { getThread, listProjectThreads, listThreads } from '../api/threads.api'
import { threadKeys } from '../keys/threads.keys'
import { threadsPageSize } from '../page-sizes.constants'
import type { ThreadFilters } from '../types/threads.types'

/** The threads of a project, the newest message first, a page at a time. */
export function useProjectThreads(projectId: string, { isEnabled = true }: HookQueryOptions = {}) {
  return useInfiniteQuery({
    queryKey: threadKeys.ofProject(projectId),
    queryFn: ({ pageParam }) => listProjectThreads(projectId, pageParam, threadsPageSize),
    ...cursorPagesOptions,
    enabled: isEnabled,
  })
}

/** The threads of the user across projects, narrowed by the filters, a page at a time. */
export function useThreads(
  filters: ThreadFilters = {},
  { isEnabled = true }: HookQueryOptions = {},
) {
  return useInfiniteQuery({
    queryKey: threadKeys.list(filters),
    queryFn: ({ pageParam }) => listThreads(pageParam, threadsPageSize, filters),
    ...cursorPagesOptions,
    enabled: isEnabled,
  })
}

/** One thread, read again while its latest run has not ended. */
export function useThread(threadId: string, { isEnabled = true }: HookQueryOptions = {}) {
  return useQuery({
    queryKey: threadKeys.detail(threadId),
    queryFn: () => getThread(threadId),
    refetchInterval: (query) => refetchIntervalOf(query.state.data?.latest_run_status),
    enabled: isEnabled,
  })
}
