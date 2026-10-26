import { describe, expect, it } from 'vitest'

import { canRetryOnce } from '../query-retry.utils'
import { retryCases } from './query-retry.utils.data'

describe('canRetryOnce', () => {
  it.each(retryCases)('tries once more after $name: $retries', ({ failures, error, retries }) => {
    expect(canRetryOnce(failures, error)).toBe(retries)
  })
})
