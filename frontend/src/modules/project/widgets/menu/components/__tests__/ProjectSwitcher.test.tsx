import { focusManager } from '@tanstack/react-query'
import { act, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { projectFixtures } from '@/mocks/projects/projects.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { useProjectPromptStore } from '@/modules/project/features/create'
import { ProjectDialogs } from '@/modules/project/widgets/dialogs'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'
import { renderWithProviders } from '@/test/render'
import { expectPushedTo, expectRole, pressButton, pressMenuItem, replaceText } from '@/test/steps'

import { ProjectSwitcher } from '../ProjectSwitcher'
import { switcherLabelCases } from './ProjectSwitcher.data'

afterEach(() => {
  focusManager.setFocused(undefined)
})

describe('ProjectSwitcher', () => {
  it.each(switcherLabelCases)('names $name', async ({ projectId, answer, label }) => {
    if (answer !== null) server.use(answer())
    renderWithProviders(<ProjectSwitcher projectId={projectId} />)

    await expectRole('button', label)
  })

  it('renames the open project from its menu', async () => {
    // The menu opens the dialog that the layout holds.
    renderWithProviders(
      <>
        <ProjectSwitcher projectId={projectIds.mentor} />
        <ProjectDialogs />
      </>,
    )

    await pressButton('Mentor platform')
    await pressMenuItem('Rename project')
    const name = within(await screen.findByRole('dialog', { name: 'Rename project' })).getByRole(
      'textbox',
      { name: 'Name' },
    )
    await replaceText(name, 'Mentor finder{Enter}')

    await expectRole('button', 'Mentor finder')
  })

  it('switches to a recent active project, marking the open one', async () => {
    const queries: string[] = []
    server.use(
      http.get(apiEndpoints.projects.pattern, ({ request }) => {
        queries.push(new URL(request.url).search)
        const recent = projectFixtures.filter(({ id }) => id !== projectIds.laundry)
        return HttpResponse.json({ items: recent, next_cursor: 'more' })
      }),
    )
    renderWithProviders(<ProjectSwitcher projectId={projectIds.mentor} />)

    await pressButton('Mentor platform')
    const menu = await screen.findByRole('menu')

    expect(
      await within(menu).findByRole('menuitem', { name: 'Mentor platform, open' }),
    ).toHaveAttribute('href', `/projects/${projectIds.mentor}/activity`)
    expect(within(menu).getByRole('menuitem', { name: 'Library booking' })).toHaveAttribute(
      'href',
      `/projects/${projectIds.library}/activity`,
    )
    expect(
      within(menu).queryByRole('menuitem', { name: 'Dorm laundry booking' }),
    ).not.toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: 'All projects' })).toHaveAttribute(
      'href',
      '/projects',
    )
    // The menu reads the first page only: the project list has the others.
    expect(queries).toEqual(['?status=active&limit=5'])
  })

  it('opens the prompt of the project list from the menu, to start a project', async () => {
    renderWithProviders(<ProjectSwitcher projectId={projectIds.mentor} />)

    await pressButton('Mentor platform')
    await pressMenuItem('Create project')

    await expectPushedTo('/projects')
    expect(useProjectPromptStore.getState().focusRequested).toBe(true)
  })

  it('keeps the name of the project when loading it again fails', async () => {
    renderWithProviders(<ProjectSwitcher projectId={projectIds.mentor} />)
    await screen.findByRole('button', { name: 'Mentor platform' })
    server.use(serverErrorOn(HttpMethod.Get, apiEndpoints.project.pattern))

    // Coming back to the window loads the project again.
    act(() => {
      focusManager.setFocused(false)
      focusManager.setFocused(true)
    })
    await pressButton('Mentor platform')

    expect(
      await screen.findByRole('menuitem', { name: 'Load the project again' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Mentor platform', hidden: true }),
    ).toBeInTheDocument()
  })
})
