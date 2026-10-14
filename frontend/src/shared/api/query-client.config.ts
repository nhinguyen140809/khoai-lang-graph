import { QueryClient } from '@tanstack/react-query'

import { HttpStatus } from './api-error.constants'
import { ApiError } from './api-error.utils'

export function createQueryClient(): QueryClient {
  return new QueryClient({
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
