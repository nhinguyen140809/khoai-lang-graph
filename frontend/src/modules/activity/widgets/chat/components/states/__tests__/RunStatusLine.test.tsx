import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { buildRun } from '@/mocks/runs/fixtures/runs.fixtures'
import { projectIds, threadIds } from '@/mocks/shared/db'
import type { RunStatus } from '@/modules/run/entities'
import { renderWithProviders } from '@/test/render'
import { expectNoRole } from '@/test/steps'

import { RunStatusLine } from '../RunStatusLine'

function runWith(status: RunStatus, stage = 'planning') {
  return buildRun({
    id: 'r1',
    thread_id: threadIds.mentorMain,
    project_id: projectIds.mentor,
    number: 1,
    status,
    current_stage: stage,
  })
}

describe('RunStatusLine', () => {
  it('says that the work goes on, with the stage it is at', async () => {
    renderWithProviders(<RunStatusLine run={runWith('running')} />)

    // The title of the stage comes once the definition has loaded; until then the status alone shows.
    expect(screen.getByRole('status')).toHaveTextContent('Working')
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/^Working: .+/)
    })
  })

  it('says that the work is about to start', () => {
    renderWithProviders(<RunStatusLine run={runWith('queued', 'not_a_stage')} />)

    expect(screen.getByRole('status')).toHaveTextContent('Starting')
  })

  it.each(['interrupted', 'succeeded', 'failed', 'cancelled'] as const)(
    'shows nothing for a run that is %s',
    (status) => {
      renderWithProviders(<RunStatusLine run={runWith(status)} />)

      expectNoRole('status')
    },
  )
})
