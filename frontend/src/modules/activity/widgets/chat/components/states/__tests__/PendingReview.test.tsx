import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { buildRun } from '@/mocks/runs/fixtures/runs.fixtures'
import { projectIds, runIds, threadIds } from '@/mocks/shared/db'
import type { Interrupt } from '@/modules/review/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { getApiItems } from '@/test/msw'
import { renderWithProviders } from '@/test/render'
import { expectAttribute, press } from '@/test/steps'

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
  it('stands the agent that waits on a corner of the card, in the mood of waiting', async () => {
    renderWithProviders(<PendingReview interrupt={await readPending()} run={run} />)

    await waitFor(() => {
      expect(document.querySelector('[data-slot=face][data-mood=waiting]')).not.toBeNull()
    })
  })

  it('starts the answer again when the run asks another review, whatever was chosen for the one before', async () => {
    const first = await readPending()
    const view = renderWithProviders(<PendingReview interrupt={first} run={run} />)
    const redo = await screen.findByRole('radio', { name: 'Redo the analysis' })
    await press(redo)
    expect(redo).toHaveAttribute('aria-checked', 'true')

    view.rerender(<PendingReview interrupt={{ ...first, id: 'another-review' }} run={run} />)

    await waitFor(() => {
      expectAttribute('radio', 'Approve analysis', 'aria-checked', 'true')
    })
    expectAttribute('radio', 'Redo the analysis', 'aria-checked', 'false')
  })
})
