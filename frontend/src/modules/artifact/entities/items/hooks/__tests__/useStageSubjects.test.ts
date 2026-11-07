import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'

import { useStageSubjects } from '../useStageSubjects'

describe('useStageSubjects', () => {
  it('reads the subjects of each stage that runs once for each, by the key of the stage', async () => {
    const { result } = renderHookWithProviders(() => useStageSubjects(projectIds.library, 1))

    await waitFor(() => {
      expect(result.current.get('interviewing')).toBeDefined()
    })
    const subjects = result.current.get('interviewing') ?? []
    expect(subjects.map(({ key, title }) => [key, title])).toEqual([
      ['PER-001', 'Mai'],
      ['PER-002', 'Phong'],
      ['PER-003', 'Phuc'],
    ])
    // A kind with one artifact for the project gives no subject.
    expect(result.current.get('planning')).toBeUndefined()
  })

  it('reads none while no version is given', () => {
    const { result } = renderHookWithProviders(() =>
      useStageSubjects(projectIds.library, undefined),
    )

    expect(result.current.size).toBe(0)
  })
})
