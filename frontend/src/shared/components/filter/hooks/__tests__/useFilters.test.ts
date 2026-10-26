import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { setPathname, setQuery } from '@/test/next-stubs'
import { routerMock } from '@/test/next-stubs/next-stubs.utils'

import { testFields } from '../../__tests__/filter.reducer.data'
import { useFilters } from '../useFilters'

describe('useFilters', () => {
  it('reads the filters from the address, and counts those that have a value', () => {
    setQuery('status=open&status=closed&period=7&step=abc')

    const { result } = renderHook(() => useFilters(testFields))

    expect(result.current).toMatchObject({
      values: { status: ['open', 'closed'], period: ['7'] },
      count: 2,
    })
  })

  it('applies values by replacing the address, keeping its other parameters', () => {
    setPathname('/projects')
    setQuery('step=abc&status=open')
    const { result } = renderHook(() => useFilters(testFields))

    act(() => {
      result.current.apply({ status: ['closed'], period: ['1'] })
    })

    expect(routerMock.replace).toHaveBeenCalledWith('/projects?step=abc&status=closed&period=1', {
      scroll: false,
    })
  })

  it('clears the filters from the address', () => {
    setPathname('/projects')
    setQuery('status=open&period=7')
    const { result } = renderHook(() => useFilters(testFields))

    act(() => {
      result.current.clear()
    })

    expect(routerMock.replace).toHaveBeenCalledWith('/projects', { scroll: false })
  })
})
