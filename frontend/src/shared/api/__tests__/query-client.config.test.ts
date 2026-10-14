import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../api-error.utils'
import type * as authRedirect from '../auth-redirect.utils'
import { createQueryClient } from '../query-client.config'

const { redirectToSignIn } = vi.hoisted(() => ({ redirectToSignIn: vi.fn() }))

vi.mock('../auth-redirect.utils', async (importOriginal) => ({
  ...(await importOriginal<typeof authRedirect>()),
  redirectToSignIn,
}))

const apiError = (status: number) => new ApiError('Failed', status, null, [])

beforeEach(() => {
  redirectToSignIn.mockClear()
})

describe('createQueryClient', () => {
  it('opens the sign-in page when a query answers 401', async () => {
    const client = createQueryClient()

    await client
      .query({ queryKey: ['x'], queryFn: () => Promise.reject(apiError(401)), retry: false })
      .catch(() => undefined)

    expect(redirectToSignIn).toHaveBeenCalledTimes(1)
  })

  it('opens the sign-in page when a mutation answers 401', async () => {
    const client = createQueryClient()
    const mutation = client
      .getMutationCache()
      .build(client, { mutationFn: () => Promise.reject(apiError(401)) })

    await mutation.execute(undefined).catch(() => undefined)

    expect(redirectToSignIn).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['another status', apiError(403)],
    ['an error that is not of the API', new Error('offline')],
  ])('stays on the page for %s', async (_name, error) => {
    const client = createQueryClient()

    await client
      .query({ queryKey: ['x'], queryFn: () => Promise.reject(error), retry: false })
      .catch(() => undefined)

    expect(redirectToSignIn).not.toHaveBeenCalled()
  })

  it('tries a failed query once more, unless the API answered with a 4xx status', () => {
    const retry = createQueryClient().getDefaultOptions().queries?.retry
    if (typeof retry !== 'function') throw new Error('retry is not a function')

    expect(retry(0, apiError(404))).toBe(false)
    expect(retry(0, apiError(401))).toBe(false)
    expect(retry(0, apiError(500))).toBe(true)
    expect(retry(1, apiError(500))).toBe(false)
    expect(retry(0, new Error('offline'))).toBe(true)
    expect(retry(1, new Error('offline'))).toBe(false)
  })
})
