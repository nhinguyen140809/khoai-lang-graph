import { describe, expect, it } from 'vitest'

import { keyCases } from './threads.keys.data'

describe('threadKeys', () => {
  it.each(keyCases)('starts the key of $name with the key above it', ({ key, wider }) => {
    expect(key.slice(0, wider.length)).toEqual(wider)
  })
})
