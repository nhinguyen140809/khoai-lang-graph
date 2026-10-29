import { describe, expect, it } from 'vitest'

import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'

import { useReviewableCheckpoints } from '../useCheckpointQueries'

describe('useReviewableCheckpoints', () => {
  it('lists the checkpoints of the current definition', async () => {
    const { result } = renderHookWithProviders(() => useReviewableCheckpoints())

    await waitForSuccess(result)
    expect(result.current.data?.map(({ id }) => id)).toEqual([
      'checkpoint_personas',
      'checkpoint_analysis',
      'checkpoint_spec',
    ])
  })

  it('lists the checkpoints of a version', async () => {
    const { result } = renderHookWithProviders(() => useReviewableCheckpoints(1))

    await waitForSuccess(result)
    expect(result.current.data?.[1]?.title).toBe('Review the analysis')
  })
})
