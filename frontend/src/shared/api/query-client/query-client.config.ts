import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

import { ApiError } from '@/shared/api/error'
import { HttpStatus } from '@/shared/api/http'

import { canRetryOnce } from './query-retry.utils'

/**
 * The client of the queries and the mutations. A request without a session calls `onUnauthorized`,
 * whichever query or mutation sent it; the caller decides where the user goes.
 */
export function createQueryClient(onUnauthorized: () => void): QueryClient {
  const onError = (error: Error) => {
    if (error instanceof ApiError && error.status === HttpStatus.Unauthorized) onUnauthorized()
  }
  return new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: canRetryOnce,
      },
    },
  })
}
