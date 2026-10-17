import { focusManager } from '@tanstack/react-query'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { mockProjects } from '@/mocks/projects/projects.fixtures'
import { PROJECT_IDS } from '@/mocks/shared/mock-ids.constants'
import { routerMock } from '@/test/next-mocks.utils'
import { TestProviders } from '@/test/TestProviders'

import { useProjectDialogsStore } from '../../../stores/project-dialogs.store'
import { useProjectPromptStore } from '../../../stores/project-prompt.store'
import { ProjectDialogs } from '../ProjectDialogs'
import { ProjectSwitcher } from '../ProjectSwitcher'
import { switcherLabelCases } from './ProjectSwitcher.data'

vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)
vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)

beforeEach(() => {
  useProjectPromptStore.setState({ focusRequested: false })
  useProjectDialogsStore.getState().closed()
  routerMock.push.mockClear()
})

afterEach(() => {
  focusManager.setFocused(undefined)
})

describe('ProjectSwitcher', () => {
  it.each(switcherLabelCases)('names $name', async ({ projectId, answer, label }) => {
    if (answer !== null) server.use(answer())
    render(<ProjectSwitcher projectId={projectId} />, { wrapper: TestProviders })

    expect(await screen.findByRole('button', { name: label })).toBeInTheDocument()
  })

  it('renames the open project from its menu', async () => {
    // The menu opens the dialog that the layout holds.
    render(
      <>
        <ProjectSwitcher projectId={PROJECT_IDS.mentor} />
        <ProjectDialogs />
      </>,
      { wrapper: TestProviders },
    )

    await userEvent.click(await screen.findByRole('button', { name: 'Mentor platform' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename project' }))
    const name = within(await screen.findByRole('dialog', { name: 'Rename project' })).getByRole(
      'textbox',
      { name: 'Name' },
    )
    await userEvent.clear(name)
    await userEvent.type(name, 'Mentor finder{Enter}')

    expect(await screen.findByRole('button', { name: 'Mentor finder' })).toBeInTheDocument()
  })

  it('switches to a recent active project, marking the open one', async () => {
    const queries: string[] = []
    server.use(
      http.get('/api/v1/projects', ({ request }) => {
        queries.push(new URL(request.url).search)
        const recent = mockProjects.filter(({ id }) => id !== PROJECT_IDS.laundry)
        return HttpResponse.json({ items: recent, next_cursor: 'more' })
      }),
    )
    render(<ProjectSwitcher projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    await userEvent.click(await screen.findByRole('button', { name: 'Mentor platform' }))
    const menu = await screen.findByRole('menu')

    expect(
      await within(menu).findByRole('menuitem', { name: 'Mentor platform, open' }),
    ).toHaveAttribute('href', `/projects/${PROJECT_IDS.mentor}/activity`)
    expect(within(menu).getByRole('menuitem', { name: 'Library booking' })).toHaveAttribute(
      'href',
      `/projects/${PROJECT_IDS.library}/activity`,
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
    render(<ProjectSwitcher projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })

    await userEvent.click(await screen.findByRole('button', { name: 'Mentor platform' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Create project' }))

    expect(routerMock.push).toHaveBeenCalledWith('/projects')
    expect(useProjectPromptStore.getState().focusRequested).toBe(true)
  })

  it('keeps the name of the project when loading it again fails', async () => {
    render(<ProjectSwitcher projectId={PROJECT_IDS.mentor} />, { wrapper: TestProviders })
    await screen.findByRole('button', { name: 'Mentor platform' })
    server.use(
      http.get('/api/v1/projects/:projectId', () => new HttpResponse(null, { status: 500 })),
    )

    // Coming back to the window loads the project again.
    act(() => {
      focusManager.setFocused(false)
      focusManager.setFocused(true)
    })
    await userEvent.click(screen.getByRole('button', { name: 'Mentor platform' }))

    expect(
      await screen.findByRole('menuitem', { name: 'Load the project again' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Mentor platform', hidden: true }),
    ).toBeInTheDocument()
  })
})
