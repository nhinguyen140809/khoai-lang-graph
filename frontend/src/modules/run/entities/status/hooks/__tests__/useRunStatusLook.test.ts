import { renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { ViewProvider } from '@/shared/lib/view'

import { useRunStatusLook } from '../useRunStatusLook'
import { statusLookCases } from './useRunStatusLook.data'

describe('useRunStatusLook', () => {
  it.each(statusLookCases)(
    'gives the look of $name in the $view view',
    ({ status, view, label, tone, needsUser }) => {
      const { result } = renderHook(() => useRunStatusLook(status), {
        wrapper: ({ children }: { children: ReactNode }) =>
          createElement(ViewProvider, { value: view, children }),
      })

      expect(result.current).toMatchObject({ label, tone, needsUser })
    },
  )
})
