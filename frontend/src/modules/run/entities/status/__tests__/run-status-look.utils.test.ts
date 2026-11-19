import { describe, expect, it } from 'vitest'

import { runStatusLook } from '../run-status-look.utils'
import { lookCases } from './run-status-look.utils.data'

describe('runStatusLook', () => {
  it.each(lookCases)('shows $name', ({ status, view, look }) => {
    expect(runStatusLook(status, view)).toEqual(look)
  })
})
