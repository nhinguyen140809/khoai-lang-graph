import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'

import { useStageTitle, useVisibleStages } from '../useStageQueries'

describe('useStageTitle', () => {
  it('gives the title of a stage in a version', async () => {
    const { result } = renderHookWithProviders(() => useStageTitle(1, 'analysis_review'))

    await waitFor(() => {
      expect(result.current).toBe('Reviewing the analysis')
    })
  })

  it('stays idle without a version', () => {
    const { result } = renderHookWithProviders(() => useStageTitle(undefined, 'analysis_review'))

    expect(result.current).toBeUndefined()
  })

  it('gives no title without a stage', () => {
    const { result } = renderHookWithProviders(() => useStageTitle(1, null))

    expect(result.current).toBeUndefined()
  })
})

describe('useVisibleStages', () => {
  it('gives the stages that the user sees in a version', async () => {
    const { result } = renderHookWithProviders(() => useVisibleStages(1))

    await waitForSuccess(result)
    expect(result.current.data?.map(({ key }) => key)).not.toContain('intent_routing')
    expect(result.current.data?.map(({ key }) => key)).toContain('analysis_review')
  })

  it('stays idle without a version', () => {
    const { result } = renderHookWithProviders(() => useVisibleStages(undefined))

    expect(result.current.data).toBeUndefined()
  })
})
