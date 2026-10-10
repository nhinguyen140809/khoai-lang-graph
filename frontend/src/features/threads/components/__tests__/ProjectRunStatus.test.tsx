import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { PROJECT_IDS, RUN_IDS, THREAD_IDS } from '@/mocks/mock-ids.constants'
import { server } from '@/mocks/msw-server.setup'
import { TestProviders } from '@/test/TestProviders'

import { ProjectRunStatus } from '../ProjectRunStatus'

vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

describe('ProjectRunStatus', () => {
  it('shows the run that waits for review, and links to it in Workflow', async () => {
    render(<ProjectRunStatus projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    const link = await screen.findByRole('link', { name: /Run 3: waiting for review/ })
    expect(link).toHaveAttribute(
      'href',
      `/projects/${PROJECT_IDS.mentor}/workflow/${RUN_IDS.mentorMain3}`,
    )
    expect(link).toHaveTextContent('analysis_review')
    expect(link).toHaveTextContent('step 67')
    expect(link).toHaveTextContent('$0.42 of $2.00')
    expect(link).toHaveTextContent('workflow v1')
  })

  it('lists the threads of the other unfinished runs', async () => {
    window.history.pushState({}, '', '/?mock-parallel-runs=many')
    render(<ProjectRunStatus projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    await userEvent.click(await screen.findByRole('button', { name: '+2 unfinished runs' }))

    const running = await screen.findByRole('link', { name: /Booking rules/ })
    expect(running).toHaveTextContent('running')
    expect(running).toHaveAttribute(
      'href',
      `/projects/${PROJECT_IDS.mentor}/chat/${THREAD_IDS.mentorBooking}`,
    )
    expect(screen.getByRole('link', { name: /Export formats/ })).toHaveTextContent('queued')
    window.history.pushState({}, '', '/')
  })

  it('shows the latest run when no run is unfinished', async () => {
    render(<ProjectRunStatus projectId={PROJECT_IDS.campus} />, { wrapper: TestProviders })

    expect(await screen.findByRole('link', { name: /Run 1: done/ })).toBeInTheDocument()
  })

  it('says so when the project has no run yet', async () => {
    server.use(
      http.get('/api/v1/projects/:projectId/threads', () =>
        HttpResponse.json({ items: [], next_cursor: null }),
      ),
    )
    render(<ProjectRunStatus projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    expect(await screen.findByText('No runs yet')).toBeInTheDocument()
  })

  it('shows the error with a retry', async () => {
    server.use(http.get('/api/v1/runs/:runId', () => new HttpResponse(null, { status: 500 })))
    render(<ProjectRunStatus projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load the run (HTTP 500)')

    server.resetHandlers()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('link', { name: /Run 3/ })).toBeInTheDocument()
  })
})
