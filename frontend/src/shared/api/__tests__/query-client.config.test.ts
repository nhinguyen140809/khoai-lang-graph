import { beforeEach, describe, expect, it, vi } from 'vitest'

import { retryOnce } from '../api-retry.utils'
import type * as authRedirect from '../auth-redirect.utils'
import { createQueryClient } from '../query-client.config'
import { keptPageCases, unauthorizedError } from './query-client.config.data'

const { redirectToSignIn } = vi.hoisted(() => ({ redirectToSignIn: vi.fn() }))

vi.mock('../auth-redirect.utils', async (importOriginal) => ({
  ...(await importOriginal<typeof authRedirect>()),
  redirectToSignIn,
}))

function failQuery(error: Error) {
  return createQueryClient()
    .query({ queryKey: ['x'], queryFn: () => Promise.reject(error), retry: false })
    .catch(() => undefined)
}

beforeEach(() => {
  redirectToSignIn.mockClear()
})

describe('createQueryClient', () => {
  it('opens the sign-in page when a query answers 401', async () => {
    await failQuery(unauthorizedError)

    expect(redirectToSignIn).toHaveBeenCalledTimes(1)
  })

  it('opens the sign-in page when a mutation answers 401', async () => {
    const client = createQueryClient()
    const mutation = client
      .getMutationCache()
      .build(client, { mutationFn: () => Promise.reject(unauthorizedError) })

    await mutation.execute(undefined).catch(() => undefined)

    expect(redirectToSignIn).toHaveBeenCalledTimes(1)
  })

  it.each(keptPageCases)('stays on the page for $name', async ({ error }) => {
    await failQuery(error)

    expect(redirectToSignIn).not.toHaveBeenCalled()
  })

  it('tries a failed query once more only when it may answer otherwise', () => {
    expect(createQueryClient().getDefaultOptions().queries?.retry).toBe(retryOnce)
  })
})
