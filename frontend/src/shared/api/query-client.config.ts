import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

import { HttpStatus } from './api-error.constants'
import { ApiError } from './api-error.utils'
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
        // An answer such as 401 or 404 does not change on a second try; a network error or a
        // server error may.
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status < HttpStatus.InternalServerError) &&
          failureCount < 1,
      },
    },
  })
}
