import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

import { redirectToSignIn } from '../auth-redirect.utils'
import { HttpStatus } from '../error/api-error.types'
import { ApiError } from '../error/api-error.utils'
import { retryOnce } from './api-retry.utils'

// A request without a session goes to the sign-in page, whichever query or mutation sent it.
function onError(error: Error) {
  if (error instanceof ApiError && error.status === HttpStatus.Unauthorized) redirectToSignIn()
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
