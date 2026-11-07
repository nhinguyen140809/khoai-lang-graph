import { renderHook } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'

import { ViewProvider } from '@/shared/lib/view'

import { stageStatuses } from '../../stage-progress.types'
import { useStageStatusLook } from '../useStageStatusLook'

describe('useStageStatusLook', () => {
  it.each(stageStatuses)('gives the look of %s in the view of the app', (status) => {
    const { result } = renderHook(() => useStageStatusLook(status), {
      wrapper: ({ children }) => createElement(ViewProvider, { value: 'user', children }),
    })

    expect(result.current.tone).not.toBe('')
    expect(result.current.label).not.toBe('')
  })
})
