import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

import { HttpStatus } from './api-error.types'
import { ApiError } from './api-error.utils'
import { retryOnce } from './api-retry.utils'
import { redirectToSignIn } from './auth-redirect.utils'

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
