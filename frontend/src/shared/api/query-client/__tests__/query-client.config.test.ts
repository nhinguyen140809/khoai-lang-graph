import { beforeEach, describe, expect, it, vi } from 'vitest'

import type * as authRedirect from '../../../lib/url/reload.utils'
import { createQueryClient } from '../query-client.config'
import { canRetryOnce } from '../query-retry.utils'
import { keptPageCases, unauthorizedError } from './query-client.config.data'

const { redirectToLogin } = vi.hoisted(() => ({ redirectToLogin: vi.fn() }))

vi.mock('../../../lib/url/reload.utils', async (importOriginal) => ({
  ...(await importOriginal<typeof authRedirect>()),
  redirectToLogin,
}))

function failQuery(error: Error) {
  return createQueryClient()
    .query({ queryKey: ['x'], queryFn: () => Promise.reject(error), retry: false })
    .catch(() => undefined)
}

beforeEach(() => {
  redirectToLogin.mockClear()
})

describe('createQueryClient', () => {
  it('opens the login page when a query answers 401', async () => {
    await failQuery(unauthorizedError)

    expect(redirectToLogin).toHaveBeenCalledTimes(1)
  })

  it('opens the login page when a mutation answers 401', async () => {
    const client = createQueryClient()
    const mutation = client
      .getMutationCache()
      .build(client, { mutationFn: () => Promise.reject(unauthorizedError) })

    await mutation.execute(undefined).catch(() => undefined)

    expect(redirectToLogin).toHaveBeenCalledTimes(1)
  })

  it.each(keptPageCases)('stays on the page for $name', async ({ error }) => {
    await failQuery(error)

    expect(redirectToLogin).not.toHaveBeenCalled()
  })

  it('tries a failed query once more only when it may answer otherwise', () => {
    expect(createQueryClient().getDefaultOptions().queries?.retry).toBe(canRetryOnce)
  })
})
