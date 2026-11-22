import { renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { FacePlacesProvider } from '../../FacePlacesProvider'
import { useFacePlace } from '../useFacePlace'

function wrapperOf(seeds: readonly string[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(FacePlacesProvider, { seeds, children })
  }
}

describe('useFacePlace', () => {
  it('is the place of the seed among the agents of the workflow', () => {
    const { result } = renderHook(() => useFacePlace('analyst'), {
      wrapper: wrapperOf(['planner', 'analyst']),
    })

    expect(result.current).toBe(1)
  })

  it('has none for an agent the workflow does not list, or without a provider', () => {
    expect(
      renderHook(() => useFacePlace('critic'), { wrapper: wrapperOf(['planner']) }).result.current,
    ).toBeUndefined()
    expect(renderHook(() => useFacePlace('critic')).result.current).toBeUndefined()
  })

  it('takes the place that it is given before any other', () => {
    const { result } = renderHook(() => useFacePlace('analyst', 4), {
      wrapper: wrapperOf(['analyst']),
    })

    expect(result.current).toBe(4)
  })
})
