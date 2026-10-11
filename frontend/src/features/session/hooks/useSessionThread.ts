import { useQuery } from '@tanstack/react-query'

import { getSessionThreadId } from '../session.api'

/**
 * The thread that holds the session of the project, resolved on first visit and on every
 * retry. The query function itself creates an empty thread when the project has none, so the
 * session always has a place to send its first message to.
 */
export function useSessionThread(projectId: string, enabled = true) {
  return useQuery({
    queryKey: ['session', 'thread', projectId],
    queryFn: () => getSessionThreadId(projectId),
    staleTime: 5 * 60_000,
    enabled,
  })
}
