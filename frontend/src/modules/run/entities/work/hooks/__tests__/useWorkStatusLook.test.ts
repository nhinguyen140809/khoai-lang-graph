import { renderHook } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'

import { ViewProvider } from '@/shared/lib/view'

import type { WorkStatus } from '../../work.types'
import { useWorkStatusLook } from '../useWorkStatusLook'

describe('useWorkStatusLook', () => {
  it.each(['running', 'waiting', 'stopped', 'done', 'failed'] as const satisfies WorkStatus[])(
    'gives the look of %s in the view of the app',
    (status) => {
      const { result } = renderHook(() => useWorkStatusLook(status), {
        wrapper: ({ children }) => createElement(ViewProvider, { value: 'developer', children }),
      })

      expect(result.current.tone).not.toBe('')
      expect(result.current.label).not.toBe('')
    },
  )
})
