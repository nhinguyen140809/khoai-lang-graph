import { describe, expect, it } from 'vitest'

import { resolveLoading } from '../loading-resolve.utils'
import { resolveCases } from './loading-resolve.utils.data'

describe('resolveLoading', () => {
  it.each(resolveCases)('$name', ({ request, layout, container, isNarrow, isFilling }) => {
    expect(resolveLoading(request)).toEqual({ layout, container, isNarrow, isFilling })
  })
})
