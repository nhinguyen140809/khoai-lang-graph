import { useQuery } from '@tanstack/react-query'

import { conversationThreadId, listThreadRuns } from '../workflow.api'

/** The runs of the project's conversation, newest first. */
export function useProjectRuns(projectId: string) {
  const thread = useQuery({
    queryKey: ['workflow', 'thread', projectId],
    queryFn: () => conversationThreadId(projectId),
  })
  const threadId = thread.data ?? ''
  return useQuery({
    queryKey: ['workflow', 'runs', threadId],
    queryFn: () => listThreadRuns(threadId),
    enabled: threadId !== '',
  })
}
