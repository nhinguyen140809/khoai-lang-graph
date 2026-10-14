import { describe, expect, it } from 'vitest'

import { ApiError } from '../api-error.utils'
import { createQueryClient } from '../query-client.config'

const apiError = (status: number) => new ApiError('Failed', status, null, [])

describe('createQueryClient', () => {
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
