import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { projectIds } from '@/mocks/shared/db'
import { DeskProjectPagesProvider } from '@/modules/project/entities'
import { useProjectPromptStore } from '@/modules/project/features/create'
import { ProjectDialogs } from '@/modules/project/widgets/dialogs'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { SidebarProvider } from '@/shared/components/ui/sidebar'
import { serverErrorOn } from '@/test/msw'
import { setPathname } from '@/test/next-stubs'
import { renderWithProviders } from '@/test/render'
import {
  expectNoRole,
  expectPushedTo,
  expectRole,
  expectText,
  pressButton,
  pressMenuItem,
  replaceText,
} from '@/test/steps'

import { ProjectSidebar } from '../ProjectSidebar'
import { sidebarRows } from './ProjectSidebar.data'

function renderSidebar() {
  // The menu of a project opens the dialogs that the layout holds.
  renderWithProviders(
    <DeskProjectPagesProvider>
      <SidebarProvider>
        <ProjectSidebar footer={<p>Account</p>} />
      </SidebarProvider>
      <ProjectDialogs />
    </DeskProjectPagesProvider>,
  )
}

describe('ProjectSidebar', () => {
  it('lists the latest active projects from the one that needs the user most, each a link to its chat', async () => {
    renderSidebar()

    await expectRole('link', 'Mentor platform, Waiting for you')
    const names = screen.getAllByRole('link').map((link) => link.getAttribute('aria-label'))
    const places = sidebarRows.map(({ name }) => names.indexOf(name))
    expect(places).toEqual(places.toSorted((first, second) => first - second))
    for (const { name, id } of sidebarRows) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', `/projects/${id}`)
    }
    // An older project waits for View all, and so does an archived one.
    expectNoRole('link', /Library booking/)
    expectNoRole('link', /Dorm laundry booking/)
  })

  it('marks the project whose chat is on show', async () => {
    setPathname(`/projects/${projectIds.campus}`)
    renderSidebar()

    expect(await screen.findByRole('link', { name: 'Campus food ordering' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(
      screen.getByRole('link', { name: 'Mentor platform, Waiting for you' }),
    ).not.toHaveAttribute('aria-current')
  })

  it('has a search, which opens the command palette, and a button that starts a project', async () => {
    renderSidebar()

    await expectRole('button', /^Search/)
    await expectRole('button', 'New')
  })

  it('leads to the page of every project, marked while it is on show', async () => {
    setPathname('/recents')
    renderSidebar()

    const viewAll = await screen.findByRole('link', { name: 'View all' })
    expect(viewAll).toHaveAttribute('href', '/recents')
    expect(viewAll).toHaveAttribute('aria-current', 'page')
  })

  it('shows what closes the list at its bottom', async () => {
    renderSidebar()

    await expectText('Account')
  })

  it('opens the start page with the focus in its prompt to create a project', async () => {
    renderSidebar()

    const [createButton] = screen.getAllByRole('button', { name: 'New' })
    if (createButton === undefined) throw new Error('No button creates a project')
    await userEvent.click(createButton)

    await expectPushedTo('/')
    expect(useProjectPromptStore.getState().focusRequested).toBe(true)
  })

  it('renames a project from its menu', async () => {
    renderSidebar()

    await pressButton('Actions for Mentor platform')
    await pressMenuItem('Rename')
    const dialog = await screen.findByRole('dialog', { name: 'Rename project' })
    await replaceText(within(dialog).getByRole('textbox', { name: 'Name' }), 'Mentor finder{Enter}')

    await expectRole('link', 'Mentor finder, Waiting for you')
  })

  it('offers to load the projects again when they fail to load', async () => {
    server.use(serverErrorOn(HttpMethod.Get, apiEndpoints.projects.pattern))
    renderSidebar()

    await expectRole('button', 'Failed to load projects. Try again')
    expectNoRole('link', /Mentor platform/)
  })
})
