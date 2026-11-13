import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { buildRun } from '@/mocks/runs/fixtures/runs.fixtures'
import { projectIds, runIds, threadIds } from '@/mocks/shared/db'
import type { Interrupt } from '@/modules/review/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { getApiItems } from '@/test/msw'
import { renderWithProviders } from '@/test/render'
import { expectAttribute } from '@/test/steps'

import { PendingReview } from '../PendingReview'

const run = buildRun({
  id: runIds.mentorMain3,
  thread_id: threadIds.mentorMain,
  project_id: projectIds.mentor,
  number: 3,
  status: 'interrupted',
  current_stage: 'analysis_review',
})

async function readPending(): Promise<Interrupt> {
  const [interrupt] = await getApiItems<Interrupt>(
    `${apiEndpoints.runInterrupts.path({ runId: runIds.mentorMain3 })}?status=pending&limit=1`,
  )
  if (interrupt === undefined) throw new Error('No pending interrupt in the mock')
  return interrupt
}

describe('PendingReview', () => {
  it('starts the answer again when the run asks another review, whatever was chosen for the one before', async () => {
    const first = await readPending()
    const view = renderWithProviders(
      <PendingReview interrupt={first} run={run} projectId={projectIds.mentor} />,
    )
    const redo = await screen.findByRole('radio', { name: 'Redo the analysis' })
    await userEvent.click(redo)
    expect(redo).toHaveAttribute('aria-checked', 'true')

    view.rerender(
      <PendingReview
        interrupt={{ ...first, id: 'another-review' }}
        run={run}
        projectId={projectIds.mentor}
      />,
    )

    await waitFor(() => {
      expectAttribute('radio', 'Approve analysis', 'aria-checked', 'true')
    })
    expectAttribute('radio', 'Redo the analysis', 'aria-checked', 'false')
  })
})
