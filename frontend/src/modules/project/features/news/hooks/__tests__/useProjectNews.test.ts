import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { type Project } from '@/modules/project/entities'

import { useProjectNewsStore } from '../../project-news.store'
import { useProjectNews } from '../useProjectNews'

const project = { id: 'p1', last_activity_at: '2026-11-02T10:00:00Z' } as Project

afterEach(() => {
  useProjectNewsStore.setState(useProjectNewsStore.getInitialState())
})

describe('useProjectNews', () => {
  it('has no news for a project that was never opened', () => {
    const { result } = renderHook(() => useProjectNews(project, false))

    expect(result.current).toBe(false)
  })

  it('has news once the project has activity after the one seen', () => {
    useProjectNewsStore.setState({ seenAt: { p1: '2026-11-01T10:00:00Z' } })
    const { result } = renderHook(() => useProjectNews(project, false))

    expect(result.current).toBe(true)
  })

  it('counts the activity of the project on show as seen', () => {
    useProjectNewsStore.setState({ seenAt: { p1: '2026-11-01T10:00:00Z' } })
    const { result, rerender } = renderHook(({ isOpen }) => useProjectNews(project, isOpen), {
      initialProps: { isOpen: true },
    })

    expect(result.current).toBe(false)
    act(() => {
      rerender({ isOpen: false })
    })
    expect(result.current).toBe(false)
    expect(useProjectNewsStore.getState().seenAt.p1).toBe('2026-11-02T10:00:00Z')
  })
})
