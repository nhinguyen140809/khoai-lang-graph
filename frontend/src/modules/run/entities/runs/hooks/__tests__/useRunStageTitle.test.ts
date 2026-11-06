import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { sleep } from '@/shared/lib/scheduling'
import { renderHookWithProviders } from '@/test/render'

import { useRunStageTitle } from '../useRunStageTitle'
import { stageTitleCases } from './useRunStageTitle.data'

describe('useRunStageTitle', () => {
  it.each(stageTitleCases)('gives $title for $name', async ({ run, title }) => {
    const { result } = renderHookWithProviders(() => useRunStageTitle(run))

    if (title === undefined) {
      // Waits long enough for a title that would load.
      await sleep(100)
      expect(result.current).toBeUndefined()
    } else {
      await waitFor(() => {
        expect(result.current).toBe(title)
      })
    }
  })

  it('gives nothing while the definition loads', () => {
    const { result } = renderHookWithProviders(() =>
      useRunStageTitle({ status: 'running', workflow_version: 1, current_stage: 'analysis' }),
    )

    expect(result.current).toBeUndefined()
  })
})
