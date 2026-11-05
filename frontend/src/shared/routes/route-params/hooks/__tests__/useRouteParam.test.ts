import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { setQuery } from '@/test/next-stubs'

import { RouteParam } from '../../route-params.types'
import { useRouteParam } from '../useRouteParam'

describe('useRouteParam', () => {
  it('reads the value of the parameter', () => {
    setQuery(`${RouteParam.Item}=i1`)

    const { result } = renderHook(() => useRouteParam(RouteParam.Item))

    expect(result.current).toBe('i1')
  })

  it('gives null without the parameter', () => {
    setQuery('other=1')

    const { result } = renderHook(() => useRouteParam(RouteParam.Item))

    expect(result.current).toBeNull()
  })
})
