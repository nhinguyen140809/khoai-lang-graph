import { useInfiniteQuery } from '@tanstack/react-query'

import { type LiveRunQueryOptions, refetchIntervalOf } from '@/modules/run/entities/@x/thread'
import { cursorPagesOptions } from '@/shared/api/query-client'

import { listThreadMessages } from '../api/messages.api'
import { messageKeys } from '../keys/messages.keys'
import { messagesPageSize } from '../page-sizes.constants'

/**
 * The messages of a thread, in the order they were sent, a page at a time. The list is read again
 * while the run works, since its agents add messages and take in the pending ones.
 */
export function useThreadMessages(
  threadId: string,
  { isEnabled = true, runStatus }: LiveRunQueryOptions = {},
) {
  return useInfiniteQuery({
    queryKey: messageKeys.ofThread(threadId),
    queryFn: ({ pageParam }) => listThreadMessages(threadId, pageParam, messagesPageSize),
    ...cursorPagesOptions,
    refetchInterval: refetchIntervalOf(runStatus),
    enabled: isEnabled,
  })
}
