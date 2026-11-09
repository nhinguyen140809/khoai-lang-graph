import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { serverErrorOn } from '@/test/msw'
import { resetNextStubs, routerMock, setPathname } from '@/test/next-stubs'
import { renderWithProviders } from '@/test/render'
import { itShowsQueryStates } from '@/test/suites'

import { TracePanel } from '../TracePanel'

const projectId = projectIds.mentor

function renderPanel() {
  return renderWithProviders(<TracePanel projectId={projectId} />)
}

describe('TracePanel', () => {
  itShowsQueryStates({
    cases: [
      {
        name: 'the error of the coverage',
        answer: () =>
          serverErrorOn(HttpMethod.Get, apiEndpoints.traceabilityCoverage.path({ projectId })),
        shows: 'The items could not load.',
        hides: 'Requirements without a user story',
      },
    ],
    renderScreen: () => {
      renderPanel()
    },
  })

  it('shows one row per gap with its count, and the open issues with theirs', async () => {
    renderPanel()

    await waitFor(() => {
      expect(screen.getByText('Requirements without a user story')).toBeInTheDocument()
    })
    expect(screen.getByText('Requirements without a source')).toBeInTheDocument()
    expect(screen.getByText('Links to check')).toBeInTheDocument()
    expect(screen.getByText('Open issues')).toBeInTheDocument()

    // The counts of the gaps of the mentor platform, and its open issues, show as badges.
    const badges = screen
      .getAllByText(/^\d+$/)
      .map((badge) => Number(badge.textContent))
      .filter((count) => Number.isFinite(count))
    expect(badges.length).toBeGreaterThanOrEqual(4)
  })

  it('opens the page of a gap on a click of its row', async () => {
    const user = userEvent.setup()
    routerMock.push.mockClear()
    renderPanel()

    await user.click(await screen.findByText('Links to check'))

    await waitFor(() => {
      expect(routerMock.push).toHaveBeenCalledWith(
        expect.stringContaining(`/projects/${projectId}/trace/gaps/needs_review`),
      )
    })
  })

  it('colors the title of a document row by how much its items ask of the user', async () => {
    renderPanel()

    // The specification holds REQ-003, whose link is out of date: the title of its row reads in
    // the warning tone. The kind beside the title stays muted, so two elements share the words.
    const titles = await screen.findAllByText('Requirement specification')
    const colored = titles.find((element) => element.hasAttribute('data-color'))
    expect(colored).toHaveAttribute('data-color', 'warning')
    // A document whose items need nothing keeps the plain color.
    const [plan] = screen.getAllByText('Interview plan')
    expect(plan).not.toHaveAttribute('data-color', 'warning')
  })

  it('draws one chevron on the row of a document, the one of the tree it shares', async () => {
    renderPanel()

    const [title] = await screen.findAllByText('Requirement specification')
    if (title === undefined) throw new Error('The row of the document did not load')
    const row = title.closest("[role='treeitem']")
    // The shared label of a tree item draws the chevron of a folder; the rows of Trace add none.
    expect(row?.querySelectorAll('svg').length).toBe(1)
  })

  it('opens the chain of an item on a click of its row', async () => {
    const user = userEvent.setup()
    const item = itemFixtureByKey(projectId, 'RAW-001')
    resetNextStubs()
    setPathname(`/projects/${projectId}/trace`)
    routerMock.push.mockClear()
    renderPanel()

    // No document is open on screen, and the item still draws: every document comes with its items.
    const row = await screen.findByText('Find a mentor in my field')
    await user.click(row)

    await waitFor(() => {
      expect(routerMock.push).toHaveBeenCalledWith(
        expect.stringContaining(`/projects/${projectId}/trace/items/${item.id}`),
      )
    })
  })
})
