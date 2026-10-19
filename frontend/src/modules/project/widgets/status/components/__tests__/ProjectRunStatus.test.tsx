import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { PROJECT_IDS } from '@/mocks/shared/mock-ids.constants'
import { useStopRunStore } from '@/modules/run/features/stop'
import { TestProviders } from '@/test/TestProviders'

import { ProjectRunStatus } from '../ProjectRunStatus'
import { projectStatusCases, stopButtonCases } from './ProjectRunStatus.data'

// A scenario of the mocks is chosen in the page address.
afterEach(() => {
  window.history.replaceState(null, '', '/')
  useStopRunStore.getState().close()
})

describe('ProjectRunStatus', () => {
  it.each(projectStatusCases)('shows $name', async ({ projectId, status }) => {
    render(<ProjectRunStatus projectId={projectId} />, { wrapper: TestProviders })

    // The label of the stage loads apart from the run.
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(status)
    })
  })

  it('shows that the status loads', () => {
    render(<ProjectRunStatus projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    expect(screen.getByRole('status')).toHaveTextContent('Loading status')
  })

  it('opens the activity of the project from its status', async () => {
    render(<ProjectRunStatus projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    expect(
      await screen.findByRole('link', { name: /^Waiting for you.*, open the activity$/ }),
    ).toHaveAttribute('href', `/projects/${PROJECT_IDS.mentor}/activity`)
  })

  it.each(stopButtonCases)('offers Stop for a run $state: $shown', async ({ address, shown }) => {
    window.history.replaceState(null, '', address)
    render(<ProjectRunStatus projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    await screen.findByRole('link', { name: /open the activity$/ })
    expect(screen.queryByRole('button', { name: 'Stop' }) !== null).toBe(shown)
  })

  it('stops the run after asking, then shows it stopped', async () => {
    render(<ProjectRunStatus projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    await userEvent.click(await screen.findByRole('button', { name: 'Stop' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Stop the run?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Stop run' }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Stopped')
    })
    expect(screen.queryByRole('button', { name: 'Stop' })).not.toBeInTheDocument()
  })

  it('keeps the dialog open when the run fails to stop', async () => {
    server.use(
      http.post('/api/v1/runs/:runId/cancel', () => new HttpResponse(null, { status: 500 })),
    )
    render(<ProjectRunStatus projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    await userEvent.click(await screen.findByRole('button', { name: 'Stop' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Stop the run?' })
    const confirm = within(dialog).getByRole('button', { name: 'Stop run' })
    await userEvent.click(confirm)

    await waitFor(() => {
      expect(confirm).toBeEnabled()
    })
    expect(dialog).toBeInTheDocument()
  })

  it('says why a run failed in the tooltip of the status', async () => {
    window.history.replaceState(null, '', '/?mock-run-state=failed')
    render(<ProjectRunStatus projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    await userEvent.hover(await screen.findByRole('link', { name: /^Failed/ }))

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'The model provider failed, after the retries and the fallback models.',
    )
  })

  it('says when the status fails to load, and loads it again', async () => {
    server.use(
      http.get(
        '/api/v1/projects/:projectId/threads',
        () => new HttpResponse(null, { status: 500 }),
      ),
    )
    render(<ProjectRunStatus projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load the status.')

    server.resetHandlers()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Waiting for you: Analysis review')
    })
  })
})
