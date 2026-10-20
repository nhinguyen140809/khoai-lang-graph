import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PROJECT_IDS, THREAD_IDS } from '@/mocks/shared/mock-ids.constants'
import { buildMockThread } from '@/mocks/threads/threads.fixtures'
import { TestProviders } from '@/test/TestProviders'

import { ThreadStatusList } from '../ThreadStatusList'

// The threads of the mentor platform, from the one that needs the user most.
const threads = [
  buildMockThread({
    id: THREAD_IDS.mentorMain,
    project_id: PROJECT_IDS.mentor,
    current_stage: 'analysis_review',
    latest_run_status: 'interrupted',
  }),
  buildMockThread({
    id: THREAD_IDS.mentorPricing,
    project_id: PROJECT_IDS.mentor,
    title: 'Pricing questions',
    current_stage: 'interviewing',
    latest_run_status: 'cancelled',
  }),
]

describe('ThreadStatusList', () => {
  it('lists the threads in their order, with the status and the stage of each', async () => {
    render(<ThreadStatusList threads={threads} />, { wrapper: TestProviders })

    const rows = screen.getAllByRole('listitem')
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining('Waiting for you'),
      expect.stringContaining('Stopped'),
    ])
    expect(await screen.findByText('Analysis review')).toBeInTheDocument()
    // A project has one thread for now, so the rows leave out the titles of the threads.
    expect(screen.queryByText('Pricing questions')).not.toBeInTheDocument()
  })

  it('says when nothing has started', () => {
    render(<ThreadStatusList threads={[]} />, { wrapper: TestProviders })

    expect(screen.getByText('Nothing has started yet.')).toBeInTheDocument()
  })
})
