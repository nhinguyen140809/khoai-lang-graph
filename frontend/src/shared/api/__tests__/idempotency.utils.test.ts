import { describe, expect, it } from 'vitest'

import { newIdempotencyKey } from '../idempotency.utils'

describe('newIdempotencyKey', () => {
  it('makes a UUID', () => {
    expect(newIdempotencyKey()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
  })

  it('makes a new key at each call', () => {
    expect(newIdempotencyKey()).not.toBe(newIdempotencyKey())
  })
})
