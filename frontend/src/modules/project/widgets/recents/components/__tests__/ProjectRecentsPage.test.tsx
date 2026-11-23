import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { projectIds } from '@/mocks/shared/db'
import { emptyPage } from '@/mocks/shared/http/response'
import { DeskProjectPagesProvider } from '@/modules/project/entities'
import { useProjectPromptStore } from '@/modules/project/features/create'
import { ProjectDialogs } from '@/modules/project/widgets/dialogs'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'
import { renderWithProviders } from '@/test/render'
import {
  expectAttribute,
  expectNoRole,
  expectPushedTo,
  expectRole,
  expectText,
  pressButton,
  pressKey,
  pressRole,
  typeText,
} from '@/test/steps'

import { ProjectRecentsPage } from '../ProjectRecentsPage'

function renderPage() {
  // The menu of a project opens the dialogs that the layout holds.
  renderWithProviders(
    <DeskProjectPagesProvider>
      <ProjectRecentsPage />
      <ProjectDialogs />
    </DeskProjectPagesProvider>,
  )
}

describe('ProjectRecentsPage', () => {
  it('lists every active project on the first tab, each a link to its chat', async () => {
    renderPage()

    await expectRole('heading', 'Recents')
    expectAttribute('tab', 'Active', 'aria-selected', 'true')
    // Older than the projects of the side list, and still listed here.
    expect(await screen.findByRole('link', { name: 'Library booking' })).toHaveAttribute(
      'href',
      `/projects/${projectIds.library}`,
    )
    expectNoRole('link', 'Dorm laundry booking')
  })

  it('lists the archived projects on their tab, each with Restore in its menu', async () => {
    renderPage()
    await expectRole('link', 'Mentor platform')

    await pressRole('tab', 'Archived')

    await expectRole('link', 'Dorm laundry booking')
    expectNoRole('link', 'Mentor platform')
    await pressButton('Actions for Dorm laundry booking')
    await expectRole('menuitem', 'Restore')
    expectNoRole('menuitem', 'Archive')
  })

  it('searches the projects of the tab from its button, and closes the search with Escape', async () => {
    renderPage()
    await expectRole('link', 'Mentor platform')

    await pressButton('Search projects')
    const box = screen.getByRole('textbox', { name: 'Search projects' })
    await waitFor(() => {
      expect(box).toHaveFocus()
    })
    await typeText(box, 'library')
    await expectRole('link', 'Library booking')
    expectNoRole('link', 'Mentor platform')
    await typeText(box, ' none')
    await expectText('No project matches the search.')

    await pressKey('Escape')
    expectNoRole('textbox', 'Search projects')
    await expectRole('link', 'Mentor platform')
  })

  it('opens the start page with the focus in its prompt to create a project', async () => {
    renderPage()

    await pressButton('Create project')

    await expectPushedTo('/')
    expect(useProjectPromptStore.getState().focusRequested).toBe(true)
  })

  it('says when the tab has no project', async () => {
    server.use(http.get(apiEndpoints.projects.pattern, () => HttpResponse.json(emptyPage)))
    renderPage()

    await expectRole('heading', 'Recents')
    await expectText('No projects')
  })

  it('offers to load the projects again when they fail to load', async () => {
    server.use(serverErrorOn(HttpMethod.Get, apiEndpoints.projects.pattern))
    renderPage()

    await expectRole('button', 'Try again')
    expectNoRole('link', /Mentor platform/)
  })
})
