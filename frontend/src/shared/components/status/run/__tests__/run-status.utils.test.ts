import { describe, expect, it } from 'vitest'

import { runStatusLook } from '../run-status.utils'
import { lookCases } from './run-status.utils.data'

describe('runStatusLook', () => {
  it.each(lookCases)('shows $name', ({ status, look }) => {
    expect(runStatusLook(status)).toEqual(look)
  })
})
