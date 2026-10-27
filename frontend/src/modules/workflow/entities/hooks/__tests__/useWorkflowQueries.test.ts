import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'

import {
  useReviewableCheckpoints,
  useStageTitle,
  useVisibleStages,
  useWorkflowDefinition,
} from '../useWorkflowQueries'

describe('useWorkflowDefinition', () => {
  it('loads the current definition', async () => {
    const { result } = renderHookWithProviders(() => useWorkflowDefinition())

    await waitForSuccess(result)
    expect(result.current.data?.version).toBe(1)
  })

  it('loads the definition at a version', async () => {
    const { result } = renderHookWithProviders(() => useWorkflowDefinition(1))

    await waitForSuccess(result)
    expect(result.current.data?.stages.length).toBeGreaterThan(0)
  })
})

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
