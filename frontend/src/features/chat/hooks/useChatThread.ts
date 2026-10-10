import { useQuery } from '@tanstack/react-query'

import { getChatThreadId } from '../chat.api'

/**
 * The thread that holds the conversation of the project, resolved on first visit and on every
 * retry. The query function itself creates an empty thread when the project has none, so the
 * chat always has a place to send its first message to.
 */
export function useChatThread(projectId: string) {
  return useQuery({
    queryKey: ['chat', 'thread', projectId],
    queryFn: () => getChatThreadId(projectId),
    staleTime: 5 * 60_000,
  })
}
