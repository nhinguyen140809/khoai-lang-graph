import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { ViewProvider } from '../../ViewProvider'
import { useWording } from '../useWording'

// The words of one value of the test, one for each view.
const wording = { developer: 'Waiting for review', user: 'Waiting for you' } as const

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

  it('reads the words of the default view, which is the user one', () => {
    const { result } = renderHook(() => useWording(wording))

    expect(result.current).toBe('Waiting for you')
  })
})
