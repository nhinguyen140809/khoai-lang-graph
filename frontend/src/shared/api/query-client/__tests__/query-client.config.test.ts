import { describe, expect, it, vi } from 'vitest'

import { createQueryClient } from '../query-client.config'
import { canRetryOnce } from '../query-retry.utils'
import { keptPageCases, unauthorizedError } from './query-client.config.data'

const onUnauthorized = vi.fn()

function failQuery(error: Error) {
  return createQueryClient(onUnauthorized)
    .query({ queryKey: ['x'], queryFn: () => Promise.reject(error), retry: false })
    .catch(() => undefined)
}

describe('createQueryClient', () => {
  it('asks the caller to handle it when a query answers 401', async () => {
    await failQuery(unauthorizedError)

    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('asks the caller to handle it when a mutation answers 401', async () => {
    const client = createQueryClient(onUnauthorized)
    const mutation = client
      .getMutationCache()
      .build(client, { mutationFn: () => Promise.reject(unauthorizedError) })

    await mutation.execute(undefined).catch(() => undefined)

    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it.each(keptPageCases)('leaves the caller alone for $name', async ({ error }) => {
    await failQuery(error)

    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('tries a failed query once more only when it may answer otherwise', () => {
    expect(createQueryClient(onUnauthorized).getDefaultOptions().queries?.retry).toBe(canRetryOnce)
  })
})
