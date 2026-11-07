import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { buildRun } from '@/mocks/runs/fixtures/runs.fixtures'
import { projectIds, runIds, threadIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'

import { useRunEntries } from '../useRunEntries'

// Run 3 of the mentor thread, waiting at the analysis review.
const run = buildRun({
  id: runIds.mentorMain3,
  thread_id: threadIds.mentorMain,
  project_id: projectIds.mentor,
  number: 3,
  status: 'interrupted',
  current_stage: 'analysis_review',
})

describe('useRunEntries', () => {
  it('reads the entries of a run: its messages, its work and its reviews', async () => {
    const { result } = renderHookWithProviders(() => useRunEntries(run, [], projectIds.mentor))

    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    if (result.current.state !== 'success') return
    const types = result.current.entries.map(({ type }) => type)
    expect(types).toContain('work')
    expect(types).toContain('review')
  })

  it('gives its error with a retry when the steps fail to load', async () => {
    const { result } = renderHookWithProviders(() =>
      useRunEntries(buildRun({ ...run, id: 'missing' }), [], projectIds.mentor),
    )

    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
  })
})
