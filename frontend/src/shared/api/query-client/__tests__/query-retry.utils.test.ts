import { describe, expect, it } from 'vitest'

import { retryOnce } from '../query-retry.utils'
import { retryCases } from './query-retry.utils.data'

describe('retryOnce', () => {
  it.each(retryCases)('tries once more after $name: $retries', ({ failures, error, retries }) => {
    expect(retryOnce(failures, error)).toBe(retries)
  })
})
