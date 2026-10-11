import { useQuery } from '@tanstack/react-query'

import { getConsoleThreadId } from '../console.api'

/**
 * The thread that holds the console of the project, resolved on first visit and on every
 * retry. The query function itself creates an empty thread when the project has none, so the
 * console always has a place to send its first message to.
 */
export function useConsoleThread(projectId: string, enabled = true) {
  return useQuery({
    queryKey: ['console', 'thread', projectId],
    queryFn: () => getConsoleThreadId(projectId),
    staleTime: 5 * 60_000,
    enabled,
  })
}
