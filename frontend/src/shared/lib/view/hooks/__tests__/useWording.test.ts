import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { ViewProvider } from '../../ViewProvider'
import { useWording } from '../useWording'

// A value with words of its own in the user view, and one that both views read the same.
const wording = { developer: 'Waiting for review', user: 'Waiting for you' } as const
const sharedWording = { developer: 'Done' } as const

// Wraps the hook in a provider of the given view.
function withView(view: 'user' | 'developer') {
  return ({ children }: { children: ReactNode }) => ViewProvider({ children, value: view })
}

describe('useWording', () => {
  it('reads the words of the user view', () => {
    const { result } = renderHook(() => useWording(wording), { wrapper: withView('user') })

    expect(result.current).toBe('Waiting for you')
  })

  it('reads the words of the developer view', () => {
    const { result } = renderHook(() => useWording(wording), {
      wrapper: withView('developer'),
    })

    expect(result.current).toBe('Waiting for review')
  })

  it('reads the words of the developer view for a value without words in the user view', () => {
    const { result } = renderHook(() => useWording(sharedWording), { wrapper: withView('user') })

    expect(result.current).toBe('Done')
  })

  it('reads the words of the developer view under no provider', () => {
    const { result } = renderHook(() => useWording(wording))

    expect(result.current).toBe('Waiting for review')
  })
})
