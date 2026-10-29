import { describe, expect, it } from 'vitest'

import { runStatusLook } from '../run-status-look.utils'
import { lookCases } from './run-status-look.utils.data'

describe('runStatusLook', () => {
  it.each(lookCases)('shows $name', ({ status, look }) => {
    expect(runStatusLook(status)).toEqual(look)
  })
})
