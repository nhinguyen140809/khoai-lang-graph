import { renderHook } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'

import { ViewProvider } from '@/shared/lib/view'

import { useMessageDeliveryLook } from '../useMessageLooks'

describe('useMessageDeliveryLook', () => {
  it('gives the tone of the dot of each delivery, with its label', () => {
    const { result } = renderHook(() => useMessageDeliveryLook('pending'), {
      wrapper: ({ children }) => createElement(ViewProvider, { value: 'user', children }),
    })

    expect(result.current).toMatchObject({ tone: 'warning', label: 'Not read yet' })
  })

  it('gives the primary look without a label for a message without a delivery', () => {
    const { result } = renderHook(() => useMessageDeliveryLook(null), {
      wrapper: ({ children }) => createElement(ViewProvider, { value: 'user', children }),
    })

    expect(result.current).toEqual({ tone: 'primary', label: null })
  })
})
