import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { projectIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import { ViewProvider } from '@/shared/lib/view'
import { openPage, serverError } from '@/test/msw'
import { renderWithProviders } from '@/test/render'
import {
  expectAlert,
  expectLink,
  expectNoAccessibilityViolations,
  expectNoRole,
  expectRole,
  pressButton,
} from '@/test/steps'

import { projectRunStatusMessages } from '../../project-run-status.constants'
import { ProjectRunStatus } from '../ProjectRunStatus'
import { projectStatusCases, viewCases } from './ProjectRunStatus.data'

/** Waits until the status reads `text`; the title of the stage loads apart from the run. */
async function expectStatus(text: string) {
  await waitFor(() => {
    expect(screen.getByRole('status')).toHaveTextContent(text)
  })
}

describe('ProjectRunStatus', () => {
  it('shows that the status loads', () => {
    renderWithProviders(<ProjectRunStatus projectId={projectIds.mentor} />)

    expect(screen.getByRole('status')).toHaveTextContent(projectRunStatusMessages.loading)
  })

  it.each(projectStatusCases)(
    'shows $name, with the fill $fill and Stop: $hasStop',
    async ({ address, projectId, status, fill, hasStop }) => {
      openPage(address)
      renderWithProviders(<ProjectRunStatus projectId={projectId} />)

      await expectStatus(status)

      expect(screen.getByRole('status').querySelector('[data-slot="badge"]')).toHaveAttribute(
        'data-variant',
        fill,
      )
      if (hasStop) await expectRole('button', 'Stop')
      else expectNoRole('button', 'Stop')
    },
  )

  it.each(viewCases)('reads $status in the $view view', async ({ view, address, status }) => {
    openPage(address)
    renderWithProviders(
      <ViewProvider value={view}>
        <ProjectRunStatus projectId={projectIds.mentor} />
      </ViewProvider>,
    )

    await expectStatus(status)
  })

  it('opens the activity of the project from its status', async () => {
    renderWithProviders(<ProjectRunStatus projectId={projectIds.mentor} />)

    await expectLink(
      /^Waiting for you.*, open the activity$/,
      `/projects/${projectIds.mentor}/activity`,
    )
  })

  it('says why a run failed in the tooltip of the status', async () => {
    openPage('/?mock-run-status=failed')
    renderWithProviders(<ProjectRunStatus projectId={projectIds.mentor} />)

    await userEvent.hover(await screen.findByRole('link', { name: /^Failed/ }))

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'The model provider failed, after the retries and the fallback models.',
    )
  })

  it('says when the status fails to load, and loads it again on Try again', async () => {
    server.use(http.get(apiEndpoints.projectThreads.pattern, () => serverError()))
    renderWithProviders(<ProjectRunStatus projectId={projectIds.mentor} />)

    await expectAlert(projectRunStatusMessages.failed)

    server.resetHandlers()
    await pressButton(projectRunStatusMessages.retry)

    await expectStatus('Waiting for you: Reviewing the analysis')
  })

  it('has no accessibility violations', async () => {
    renderWithProviders(<ProjectRunStatus projectId={projectIds.mentor} />)
    await expectStatus('Waiting for you: Reviewing the analysis')

    await expectNoAccessibilityViolations()
  })
})
