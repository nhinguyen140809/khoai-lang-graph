import {
  type InfiniteData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useCallback } from 'react'

import { refetchIntervalOf, type Run } from '@/modules/run/entities/@x/thread'
import { cursorPagesOptions, type HookQueryOptions, pageItems } from '@/shared/api/query-client'
import type { ListPage } from '@/shared/api/request'

import { getThread, listProjectThreads, listThreads } from '../api/threads.api'
import { threadKeys } from '../keys/threads.keys'
import { threadsPageSize } from '../page-sizes.constants'
import type { Thread, ThreadFilters } from '../types/threads.types'

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

/**
 * Loads the threads of the project of a run again when the thread of the run shows another status
 * than the run has, such as when the run starts, waits for a review, goes on after it or ends.
 * Nothing when the threads are not loaded.
 */
export function useReloadThreadsIfRunStatusChanged() {
  const queryClient = useQueryClient()

  return useCallback(
    async (run: Pick<Run, 'project_id' | 'thread_id' | 'status'>) => {
      const queryKey = threadKeys.ofProject(run.project_id)
      const loaded = queryClient.getQueryData<InfiniteData<ListPage<Thread>>>(queryKey)
      if (loaded === undefined) return

      const shown = pageItems(loaded).find(({ id }) => id === run.thread_id)?.latest_run_status
      if (shown !== run.status) await queryClient.invalidateQueries({ queryKey })
    },
    [queryClient],
  )
}
