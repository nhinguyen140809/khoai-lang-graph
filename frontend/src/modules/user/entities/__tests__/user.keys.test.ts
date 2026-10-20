import { describe, expect, it } from 'vitest'

import { userKeys } from '../user.keys'

describe('userKeys', () => {
  it('starts every key with the key of the whole user', () => {
    expect(userKeys.me().slice(0, userKeys.all().length)).toEqual(userKeys.all())
  })
})
