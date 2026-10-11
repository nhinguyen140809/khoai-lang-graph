import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PROJECT_IDS, RUN_IDS } from '@/mocks/mock-ids.constants'
import { TestProviders } from '@/test/TestProviders'

import { RunView } from '../RunView'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

describe('RunView', () => {
  it('renders the header and the timeline of the run', async () => {
    render(<RunView projectId={PROJECT_IDS.mentor} runId={RUN_IDS.mentorMain3} />, {
      wrapper: TestProviders,
    })

    expect(await screen.findByRole('heading', { name: 'Run 3' })).toBeInTheDocument()
    expect(screen.getByText(/step 67/)).toBeInTheDocument()
    expect(screen.getAllByText(/waiting for review/).length).toBeGreaterThan(0)
    const planner = await screen.findByText(/⏺ planner/)
    expect(planner).toBeInTheDocument()
    expect(screen.getByText(/⏺ persona_generator/)).toBeInTheDocument()
  })
})
