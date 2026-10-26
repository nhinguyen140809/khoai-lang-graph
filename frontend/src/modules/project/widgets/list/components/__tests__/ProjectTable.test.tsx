import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { projectIds } from '@/mocks/shared/db/mock-ids.constants'
import {
  noProjectFilters,
  type ProjectFilters,
  type ProjectStatus,
} from '@/modules/project/entities'
import { useDeleteProjectDialogStore } from '@/modules/project/features/delete'
import { useRenameProjectDialogStore } from '@/modules/project/features/rename'
import { ProjectDialogs } from '@/modules/project/widgets/dialogs'
import { routerMock } from '@/test/next-stubs/next-stubs.utils'
import { TestProviders } from '@/test/render/TestProviders'

import { ProjectTable } from '../ProjectTable'
import {
  emptyListCases,
  filteredListCases,
  listCases,
  menuCases,
  rowRunCases,
} from './ProjectTable.data'

vi.mock('next/link', async () => (await import('@/test/next-stubs/next-stubs.utils')).linkMock)
vi.mock(
  'next/navigation',
  async () => (await import('@/test/next-stubs/next-stubs.utils')).navigationMock,
)

function renderTable(status: ProjectStatus, filters: ProjectFilters = noProjectFilters) {
  const onClearFilters = vi.fn()
  // The menu of a row opens the dialogs that the layout holds.
  render(
    <>
      <ProjectTable status={status} filters={filters} onClearFilters={onClearFilters} />
      <ProjectDialogs />
    </>,
    { wrapper: TestProviders },
  )
  return { onClearFilters }
}

function answerNoProject() {
  server.use(
    http.get('/api/v1/projects', () => HttpResponse.json({ items: [], next_cursor: null })),
  )
}

afterEach(() => {
  window.history.replaceState(null, '', '/')
  routerMock.push.mockClear()
  useRenameProjectDialogStore.getState().closed()
  useDeleteProjectDialogStore.getState().closed()
})

/** Shows the long list of the mock data: more active projects than a page holds. */
async function renderLongList() {
  window.history.replaceState(null, '', '/?mock-projects=many')
  renderTable('active')
  return screen.findByRole('button', { name: 'Show more projects' })
}

async function openMenu(project: string) {
  await userEvent.click(await screen.findByRole('button', { name: `Actions for ${project}` }))
}

/** Chooses Delete in the menu of an active project, and returns the dialog that opens. */
async function chooseDelete(project: string, dialog: string) {
  renderTable('active')
  await openMenu(project)
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))
  return screen.findByRole('alertdialog', { name: dialog })
}

// Its runs ended, so it can be deleted.
const campus = 'Campus food ordering'

function askToDeleteCampus() {
  return chooseDelete(campus, 'Delete project?')
}

describe('ProjectTable', () => {
  it.each(listCases)('lists the $status projects', async ({ status, shown, hidden }) => {
    renderTable(status)

    for (const name of shown) expect(await screen.findByRole('link', { name })).toBeInTheDocument()
    for (const name of hidden) expect(screen.queryByRole('link', { name })).not.toBeInTheDocument()
  })

  it.each(rowRunCases)('says $run for the runs of $project', async ({ project, run }) => {
    renderTable('active')

    const row = (await screen.findByRole('link', { name: project })).closest('tr')
    if (row === null) throw new Error('The project has no row')
    expect(within(row).getByText(run)).toBeInTheDocument()
  })

  it('opens a project at its activity from its row', async () => {
    renderTable('active')

    expect(await screen.findByRole('link', { name: 'Mentor platform' })).toHaveAttribute(
      'href',
      `/projects/${projectIds.mentor}/activity`,
    )
  })

  it.each(menuCases)(
    'offers $items for a project of the $status list',
    async ({ status, project, items }) => {
      renderTable(status)
      await openMenu(project)

      expect((await screen.findAllByRole('menuitem')).map((item) => item.textContent)).toEqual(
        items,
      )
    },
  )

  it.each(menuCases)(
    'takes a project out of the $status list with $leave',
    async ({ status, project, leave }) => {
      renderTable(status)
      await openMenu(project)

      await userEvent.click(await screen.findByRole('menuitem', { name: leave }))

      await vi.waitFor(() => {
        expect(screen.queryByRole('link', { name: project })).not.toBeInTheDocument()
      })
    },
  )

  it('renames a project from its menu', async () => {
    renderTable('active')
    await openMenu('Mentor platform')

    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }))
    const name = within(await screen.findByRole('dialog', { name: 'Rename project' })).getByRole(
      'textbox',
      { name: 'Name' },
    )
    await userEvent.clear(name)
    await userEvent.type(name, 'Mentor finder{Enter}')

    expect(await screen.findByRole('link', { name: 'Mentor finder' })).toBeInTheDocument()
  })

  it('deletes a project once the dialog is confirmed', async () => {
    const dialog = await askToDeleteCampus()

    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete project' }))

    await vi.waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
    expect(screen.queryByRole('link', { name: campus })).not.toBeInTheDocument()
  })

  it('says to stop the run before deleting a project with a run not finished', async () => {
    const dialog = await chooseDelete('Mentor platform', 'Stop the run first')

    await userEvent.click(within(dialog).getByRole('button', { name: 'Open project' }))

    expect(routerMock.push).toHaveBeenCalledWith(`/projects/${projectIds.mentor}/activity`)
    expect(within(dialog).queryByRole('button', { name: 'Delete project' })).not.toBeInTheDocument()
  })

  it('keeps the dialog and the project when deleting fails', async () => {
    server.use(
      http.delete('/api/v1/projects/:projectId', () => new HttpResponse(null, { status: 500 })),
    )
    const dialog = await askToDeleteCampus()
    const confirm = within(dialog).getByRole('button', { name: 'Delete project' })

    await userEvent.click(confirm)

    await vi.waitFor(() => {
      expect(confirm).toBeEnabled()
    })
    expect(dialog).toBeInTheDocument()
    // The open dialog hides the page from assistive technology.
    expect(screen.getByRole('link', { name: campus, hidden: true })).toBeInTheDocument()
  })

  it.each(emptyListCases)('says $text when the list is empty', async ({ status, text }) => {
    answerNoProject()
    renderTable(status)

    expect(await screen.findByText(text)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it.each(filteredListCases)(
    'lists the projects of the filters: $name',
    async ({ filters, shown, hidden }) => {
      renderTable('active', filters)

      for (const name of shown) {
        expect(await screen.findByRole('link', { name })).toBeInTheDocument()
      }
      for (const name of hidden) {
        expect(screen.queryByRole('link', { name })).not.toBeInTheDocument()
      }
    },
  )

  it('says when no project matches the filters, and clears them', async () => {
    answerNoProject()
    const { onClearFilters } = renderTable('active', {
      runStatuses: ['failed'],
      activeWithinDays: null,
    })

    expect(
      await screen.findByRole('heading', { name: 'No projects match the filters' }),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(onClearFilters).toHaveBeenCalledOnce()
  })

  it('shows the next page of projects on demand', async () => {
    const showMore = await renderLongList()
    expect(screen.getAllByRole('link')).toHaveLength(50)

    await userEvent.click(showMore)

    await vi.waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Show more projects' })).not.toBeInTheDocument()
    })
    expect(screen.getAllByRole('link').length).toBeGreaterThan(50)
  })

  it('keeps the projects shown when the next page fails to load', async () => {
    server.use(
      http.get('/api/v1/projects', ({ request }) =>
        new URL(request.url).searchParams.has('cursor')
          ? new HttpResponse(null, { status: 500 })
          : undefined,
      ),
    )
    const showMore = await renderLongList()

    await userEvent.click(showMore)

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load projects (HTTP 500)')
    expect(screen.getAllByRole('link')).toHaveLength(50)
    expect(screen.getByRole('button', { name: 'Show more projects' })).toBeEnabled()
  })

  it('shows the error with a retry when the projects fail to load', async () => {
    server.use(http.get('/api/v1/projects', () => new HttpResponse(null, { status: 500 })))
    renderTable('active')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Failed to load projects (HTTP 500)')
    expect(within(alert).getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})
