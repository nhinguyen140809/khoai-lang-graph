import { renderHook } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'

import { ViewProvider } from '@/shared/lib/view'

import { interruptStatuses } from '../../interrupts.types'
import { useInterruptStatusLook } from '../useInterruptStatusLook'

describe('useInterruptStatusLook', () => {
  it.each(interruptStatuses)('gives the look of %s with its label', (status) => {
    const { result } = renderHook(() => useInterruptStatusLook(status), {
      wrapper: ({ children }) => createElement(ViewProvider, { value: 'user', children }),
    })

    expect(result.current.tone).not.toBe('')
    expect(result.current.label).not.toBe('')
  })
})
