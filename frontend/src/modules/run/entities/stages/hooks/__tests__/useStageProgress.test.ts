import { waitFor } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { buildRun } from '@/mocks/runs/fixtures/runs.fixtures'
import { projectIds, runIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import { serverError } from '@/test/msw'
import { renderHookWithProviders } from '@/test/render'

import { useStageProgress } from '../useStageProgress'

// Run 3 of the mentor thread, waiting at the analysis review.
const mentorRun3 = buildRun({
  id: runIds.mentorMain3,
  thread_id: 't1',
  project_id: projectIds.mentor,
  number: 3,
  status: 'interrupted',
  current_stage: 'analysis_review',
})

describe('useStageProgress', () => {
  it('gives no stage for a project without a run', () => {
    const { result } = renderHookWithProviders(() => useStageProgress(null, 'p1'))

    expect(result.current).toEqual({ state: 'success', stages: [] })
  })

  it('reads the stages of the workflow of the run, with their subjects and their statuses', async () => {
    const { result } = renderHookWithProviders(() =>
      useStageProgress(mentorRun3, projectIds.mentor),
    )

    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    if (result.current.state !== 'success') return
    const interviewing = result.current.stages.find(({ key }) => key === 'interviewing')
    expect(interviewing?.subjects.map(({ subject: { key } }) => key)).toEqual([
      'PER-001',
      'PER-002',
      'PER-003',
    ])
    expect(interviewing?.subjects[0]).toMatchObject({ status: 'done' })
    expect(result.current.stages.find(({ key }) => key === 'analysis_review')?.status).toBe(
      'waiting',
    )
  })

  it('gives its error with a retry when the stages fail to load', async () => {
    server.use(http.get(apiEndpoints.workflowDefinition.pattern, () => serverError()))

    const { result } = renderHookWithProviders(() =>
      useStageProgress(mentorRun3, projectIds.mentor),
    )

    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
  })
})
