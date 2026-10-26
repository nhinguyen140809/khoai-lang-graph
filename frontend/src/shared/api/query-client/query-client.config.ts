import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

import { redirectToLogin } from '../../lib/url/reload.utils'
import { HttpStatus } from '../error/api-error.types'
import { ApiError } from '../error/api-error.utils'
import { retryOnce } from './query-retry.utils'

// A request without a session goes to the login page, whichever query or mutation sent it.
function onError(error: Error) {
  if (error instanceof ApiError && error.status === HttpStatus.Unauthorized) redirectToLogin()
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: retryOnce,
      },
    },
  })
}
