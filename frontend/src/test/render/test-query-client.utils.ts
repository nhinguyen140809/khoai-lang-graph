import { QueryClient } from '@tanstack/react-query'

/** The query cache of a unit test: failed queries are not retried. */
export function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}
