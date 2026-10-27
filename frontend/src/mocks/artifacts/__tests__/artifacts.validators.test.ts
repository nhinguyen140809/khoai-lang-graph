import { describe, expect, it } from 'vitest'

import { newKeyPrefix } from '../artifacts.validators'
import { newKeyPrefixCases } from './artifacts.validators.data'

describe('newKeyPrefix', () => {
  it.each(newKeyPrefixCases)('gives the prefix of $name', ({ schema, content, prefix }) => {
    expect(newKeyPrefix(schema, content)).toBe(prefix)
  })
})
