import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { cursorPagesOptions, type HookQueryOptions } from '@/shared/api/query-client'

import { getExport, listProjectExports } from '../exports.api'
import { exportsPageSize } from '../exports.constants'
import { exportKeys } from '../exports.keys'

// How long the hook waits before it reads a pending export again, to see whether its file is ready.
const EXPORT_POLL_MS = 600

export function useProjectExports(projectId: string) {
  return useInfiniteQuery({
    queryKey: exportKeys.list(projectId),
    queryFn: ({ pageParam }) => listProjectExports(projectId, pageParam, exportsPageSize),
    ...cursorPagesOptions,
  })
}

/** Reads an export again while the server is preparing its file. */
export function useExport(exportId: string, { isEnabled = true }: HookQueryOptions = {}) {
  return useQuery({
    queryKey: exportKeys.detail(exportId),
    queryFn: () => getExport(exportId),
    enabled: isEnabled,
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? EXPORT_POLL_MS : false),
  })
}
