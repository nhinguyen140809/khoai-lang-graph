import { describe, expect, it } from 'vitest'

import { accountKeys } from '../account.keys'

describe('accountKeys', () => {
  it('starts every key with the key of the whole account', () => {
    expect(accountKeys.me().slice(0, accountKeys.all().length)).toEqual(accountKeys.all())
  })
})
