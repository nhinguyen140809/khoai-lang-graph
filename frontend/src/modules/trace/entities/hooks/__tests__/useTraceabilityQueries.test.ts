import { describe, expect, it } from 'vitest'

import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'

import { useTraceabilityCoverage, useTraceabilityMatrix } from '../useTraceabilityQueries'

const projectId = projectIds.mentor

describe('useTraceabilityMatrix', () => {
  it('loads the matrix of a project', async () => {
    const { result } = renderHookWithProviders(() => useTraceabilityMatrix(projectId))

    await waitForSuccess(result)
    expect(result.current.data?.rows.length).toBeGreaterThan(0)
  })
})

describe('useTraceabilityCoverage', () => {
  it('loads the coverage of a project', async () => {
    const { result } = renderHookWithProviders(() => useTraceabilityCoverage(projectId))

    await waitForSuccess(result)
    expect(result.current.data?.gaps).toHaveLength(3)
  })
})
