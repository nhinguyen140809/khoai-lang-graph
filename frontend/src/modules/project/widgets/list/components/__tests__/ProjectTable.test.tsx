import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { projectIds } from '@/mocks/shared/db'
import { emptyPage, noContent } from '@/mocks/shared/http/response'
import {
  noProjectFilters,
  type ProjectFilters,
  type ProjectStatus,
} from '@/modules/project/entities'
import { ProjectDialogs } from '@/modules/project/widgets/dialogs'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { openPage, serverError, serverErrorOn } from '@/test/msw'
import { renderWithProviders } from '@/test/render'
import {
  confirmAction,
  expectAlert,
  expectEnabled,
  expectNoConfirmDialog,
  expectNoRole,
  expectPushedTo,
  expectRole,
  expectText,
  findConfirmDialog,
  pressButton,
  pressMenuItem,
  replaceText,
} from '@/test/steps'
import { itAsksBeforeAction } from '@/test/suites'

import { ProjectTable } from '../ProjectTable'
import {
  emptyListCases,
  filteredListCases,
  listCases,
  menuCases,
  rowRunCases,
} from './ProjectTable.data'

function renderTable(status: ProjectStatus, filters: ProjectFilters = noProjectFilters) {
  const onClearFilters = vi.fn()
  // The menu of a row opens the dialogs that the layout holds.
  renderWithProviders(
    <>
      <ProjectTable status={status} filters={filters} onClearFilters={onClearFilters} />
      <ProjectDialogs />
    </>,
  )
  return { onClearFilters }
}

function answerNoProject() {
  server.use(http.get(apiEndpoints.projects.pattern, () => HttpResponse.json(emptyPage)))
}

/** Shows the long list of the mock data: more active projects than a page holds. */
async function renderLongList() {
  openPage('/?mock-projects=many')
  renderTable('active')
  return screen.findByRole('button', { name: 'Show more projects' })
}

async function openMenu(project: string) {
  await pressButton(`Actions for ${project}`)
}

/** Chooses Delete in the menu of an active project, and returns the dialog that opens. */
async function chooseDelete(project: string, dialog: string) {
  renderTable('active')
  await openMenu(project)
  await pressMenuItem('Delete')
  return findConfirmDialog(dialog)
}

// Its runs ended, so it can be deleted.
const campus = 'Campus food ordering'

function askToDeleteCampus() {
  return chooseDelete(campus, 'Delete project?')
}

describe('ProjectTable', () => {
  it.each(listCases)('lists the $status projects', async ({ status, shown, hidden }) => {
    renderTable(status)

    for (const name of shown) await expectRole('link', name)
    for (const name of hidden) expectNoRole('link', name)
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

      await pressMenuItem(leave)

      await vi.waitFor(() => {
        expectNoRole('link', project)
      })
    },
  )

  it('renames a project from its menu', async () => {
    renderTable('active')
    await openMenu('Mentor platform')

    await pressMenuItem('Rename')
    const name = within(await screen.findByRole('dialog', { name: 'Rename project' })).getByRole(
      'textbox',
      { name: 'Name' },
    )
    await replaceText(name, 'Mentor finder{Enter}')

    await expectRole('link', 'Mentor finder')
  })

  it('deletes a project once the dialog is confirmed', async () => {
    const dialog = await askToDeleteCampus()

    await confirmAction(dialog, 'Delete project')

    await expectNoConfirmDialog()
    expectNoRole('link', campus)
  })

  it('says to stop the run before deleting a project with a run not finished', async () => {
    const dialog = await chooseDelete('Mentor platform', 'Stop the run first')

    await userEvent.click(within(dialog).getByRole('button', { name: 'Open project' }))

    await expectPushedTo(`/projects/${projectIds.mentor}/activity`)
    expect(within(dialog).queryByRole('button', { name: 'Delete project' })).not.toBeInTheDocument()
  })

  describe('Delete', () => {
    let isRequested = false

    itAsksBeforeAction({
      action: 'deleting a project',
      confirmLabel: 'Delete project',
      hasRun: () => isRequested,
      open: () => {
        isRequested = false
        server.use(
          http.delete(apiEndpoints.project.pattern, () => {
            isRequested = true
            return noContent()
          }),
        )
        return askToDeleteCampus()
      },
      fail: () => {
        server.use(
          http.delete(apiEndpoints.project.pattern, () => {
            isRequested = true
            return serverError()
          }),
        )
      },
    })
  })

  it.each(emptyListCases)('says $text when the list is empty', async ({ status, text }) => {
    answerNoProject()
    renderTable(status)

    await expectText(text)
    expectNoRole('table')
  })

  it.each(filteredListCases)(
    'lists the projects of the filters: $name',
    async ({ filters, shown, hidden }) => {
      renderTable('active', filters)

      for (const name of shown) {
        await expectRole('link', name)
      }
      for (const name of hidden) {
        expectNoRole('link', name)
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
    await pressButton('Clear filters')
    expect(onClearFilters).toHaveBeenCalledOnce()
  })

  it('shows the next page of projects on demand', async () => {
    const showMore = await renderLongList()
    expect(screen.getAllByRole('link')).toHaveLength(50)

    await userEvent.click(showMore)

    await vi.waitFor(() => {
      expectNoRole('button', 'Show more projects')
    })
    expect(screen.getAllByRole('link').length).toBeGreaterThan(50)
  })

  it('keeps the projects shown when the next page fails to load', async () => {
    server.use(
      http.get(apiEndpoints.projects.pattern, ({ request }) =>
        new URL(request.url).searchParams.has('cursor') ? serverError() : undefined,
      ),
    )
    const showMore = await renderLongList()

    await userEvent.click(showMore)

    await expectAlert('Failed to load projects (HTTP 500)')
    expect(screen.getAllByRole('link')).toHaveLength(50)
    expectEnabled('button', 'Show more projects')
  })

  it('shows the error with a retry when the projects fail to load', async () => {
    server.use(serverErrorOn(HttpMethod.Get, apiEndpoints.projects.path()))
    renderTable('active')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Failed to load projects (HTTP 500)')
    await expectRole('button', 'Try again', within(alert))
  })
})
