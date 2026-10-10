import { useQuery } from '@tanstack/react-query'

import { listThreadRuns } from '../threads.api'

/** The runs of a thread, newest first; idle until a thread is given. */
export function useThreadRuns(threadId: string | undefined) {
  return useQuery({
    queryKey: ['threads', 'thread-runs', threadId],
    queryFn: () => (threadId === undefined ? Promise.resolve([]) : listThreadRuns(threadId)),
    enabled: threadId !== undefined,
  })
}
