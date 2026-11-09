import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { openPage } from '@/test/msw'
import { routerMock } from '@/test/next-stubs'
import { renderWithProviders } from '@/test/render'

import { ItemTracePage } from '../ItemTracePage'

const projectId = projectIds.mentor

function renderPage(itemId: string) {
  return renderWithProviders(<ItemTracePage projectId={projectId} itemId={itemId} />)
}

describe('ItemTracePage', () => {
  it('names the chain after the item and lays its nodes out', async () => {
    const item = itemFixtureByKey(projectId, 'AR-003')
    renderPage(item.id)

    expect(await screen.findByText('Trace of Search with free hours')).toBeInTheDocument()
    // The chain reaches both walks: the interview messages on the left, the backlog on the right.
    expect(
      await screen.findByText(
        'I ask seniors in my club, but I never know who is free this week, so I give up.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Filter by free hours')).toBeInTheDocument()
    // The more button of a node names the item it acts on.
    expect(
      document.querySelector('button[aria-label="More actions for See who is free this week"]'),
    ).not.toBeNull()
  })

  it('draws every look of a node in the chain of AR-003, and rings only the item of the page', async () => {
    const item = itemFixtureByKey(projectId, 'AR-003')
    renderPage(item.id)

    await screen.findByText('Trust before booking')
    // Each node carries the look of what its item asks, or is: one to check, one to follow, an
    // approved one, a draft and one that is set aside read differently (the buttons inside a node carry a variant of their own).
    const looks = new Set(
      [...document.querySelectorAll('.react-flow__node div[data-variant]')].map(
        (node) =>
          `${node.getAttribute('data-variant') ?? ''}:${node.getAttribute('data-color') ?? ''}`,
      ),
    )
    expect(looks).toEqual(
      new Set([
        'solid:chart',
        'soft:warning',
        'soft:primary',
        'solid:primary',
        'outline:neutral',
        'soft:muted',
      ]),
    )
    // The ring of the subject is read from the presence of its attribute, so no other node has it.
    const ringed = document.querySelectorAll('.react-flow__node [data-focus]')
    expect(ringed).toHaveLength(1)
    expect(ringed[0]).toHaveTextContent('Search with free hours')
  })

  it('keeps the explanation of the page behind its information button, not under the title', async () => {
    const user = userEvent.setup()
    const item = itemFixtureByKey(projectId, 'AR-003')
    renderPage(item.id)

    await screen.findByText('Trace of Search with free hours')
    expect(screen.queryByText(/The items on the left are what this item is based on/)).toBeNull()

    await user.click(screen.getByRole('button', { name: 'How to read this page' }))

    expect(
      await screen.findByText(/The items on the left are what this item is based on/),
    ).toBeVisible()
    // How to move around the graph is said once here, with the key of the platform.
    expect(
      screen.getByText(/To zoom, hold (Ctrl|Cmd) and turn the mouse wheel, or use the buttons/),
    ).toBeVisible()
    expect(screen.getByText(/To move the graph, drag its empty space/)).toBeVisible()
    // Each fill of an item is said in a sentence of its own, from the strongest to the plainest.
    for (const sentence of [
      'The item needs a check: a link to it is out of date, or an open issue is about it.',
      'The item lacks a link, or it is an issue that is still open.',
      'The item was approved.',
      'The item is a draft that nobody reviewed yet.',
      'The item was rejected or replaced, so it is faded.',
      'The item of this page is the solid one, with a thicker border.',
    ]) {
      expect(screen.getByText(sentence)).toBeVisible()
    }
    // Each look of a line is said in a full sentence of its own.
    expect(screen.getByText('The link is up to date and no issue is open about it.')).toBeVisible()
    expect(screen.getByText('The link comes from an issue that is still open.')).toBeVisible()
    expect(screen.getByText('The link is to an item that was rejected or replaced.')).toBeVisible()
  })

  it('says in a notice over the graph that an item has no link yet', async () => {
    const item = itemFixtureByKey(projectId, 'ASM-001')
    renderPage(item.id)

    const notice = await screen.findByRole('alert')

    expect(notice).toHaveTextContent('This item has no link yet.')
  })

  it('answers notFound for an item that does not exist', async () => {
    renderPage('00000000-0000-4000-8000-000000000000')

    await waitFor(() => {
      expect(screen.getByText('This item does not exist.')).toBeInTheDocument()
    })
  })

  it('shows the error state when the trace fails', async () => {
    openPage('/?mock-traces=error')
    const item = itemFixtureByKey(projectId, 'AR-003')
    renderPage(item.id)

    await waitFor(() => {
      expect(screen.getByText('The trace could not load.')).toBeInTheDocument()
    })
  })

  it('opens the menu of a node with its actions', async () => {
    const user = userEvent.setup()
    const item = itemFixtureByKey(projectId, 'AR-003')
    renderPage(item.id)

    const more = await waitFor(() => {
      const button = document.querySelector<HTMLButtonElement>(
        'button[aria-label="More actions for Search with free hours"]',
      )
      if (button === null) throw new Error('The more button is not there yet')
      return button
    })
    await user.click(more)

    expect(await screen.findByRole('menuitem', { name: 'Open' })).toBeInTheDocument()
    expect(
      await screen.findByRole('menuitem', { name: 'Link to another item' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Open in a new tab' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'View its trace' })).toBeInTheDocument()
  })

  it('opens no page when the menu of a node opens, and one page when an action of it is chosen', async () => {
    const user = userEvent.setup()
    const item = itemFixtureByKey(projectId, 'AR-003')
    routerMock.push.mockClear()
    renderPage(item.id)

    const more = await waitFor(() => {
      const button = document.querySelector<HTMLButtonElement>(
        'button[aria-label="More actions for Search with free hours"]',
      )
      if (button === null) throw new Error('The more button is not there yet')
      return button
    })
    await user.click(more)
    await user.click(await screen.findByRole('menuitem', { name: 'View its trace' }))

    await waitFor(() => {
      expect(routerMock.push).toHaveBeenCalledTimes(1)
    })
    expect(routerMock.push).toHaveBeenCalledWith(
      expect.stringContaining(`/projects/${projectId}/trace/items/${item.id}`),
    )
  })

  it('carries the words of the chosen link in the data of its nodes, ready to draw', async () => {
    // jsdom cannot measure the canvas, so React Flow draws no edges there; the quotes a chosen
    // link shows in its nodes are covered by the entity tests, and drawn in a browser.
    const item = itemFixtureByKey(projectId, 'AR-003')
    renderPage(item.id)

    expect(await screen.findByText('Trace of Search with free hours')).toBeInTheDocument()
    expect(document.querySelector('.react-flow__edgelabel-renderer')).toBeInTheDocument()
  })

  it('shows the strip of a link below the graph once the link is chosen from the notice', async () => {
    const user = userEvent.setup()
    const item = itemFixtureByKey(projectId, 'AR-007')
    renderPage(item.id)

    const notice = await screen.findByRole('alert')
    expect(notice).toHaveTextContent('1 link is out of date.')
    await user.click(within(notice).getByRole('button', { name: 'Show the link' }))

    // The notice stays and the strip of the chosen link joins it, with the title of the link.
    const alerts = await screen.findAllByRole('alert')
    expect(alerts).toHaveLength(2)
    expect(alerts[1]).toHaveTextContent('Based on')
  })

  it('turns the chevron of the list of links when the list opens, as the sections of the panels do', async () => {
    const user = userEvent.setup()
    const item = itemFixtureByKey(projectId, 'AR-003')
    renderPage(item.id)

    const trigger = await screen.findByRole('button', { name: 'Read the links as a list' })
    const chevron = trigger.querySelector('svg')
    expect(trigger).toHaveAttribute('data-state', 'closed')
    expect(chevron).toHaveClass('in-data-[state=open]:rotate-90')

    await user.click(trigger)

    // The class reads the state of the trigger, which the click has turned to open.
    expect(trigger).toHaveAttribute('data-state', 'open')
  })

  it('reads the links as a list of sentences', async () => {
    const user = userEvent.setup()
    const item = itemFixtureByKey(projectId, 'AR-003')
    renderPage(item.id)

    const trigger = await screen.findByRole('button', { name: 'Read the links as a list' })
    await user.click(trigger)

    // Each sentence reads across the links of both titles, so it is read from its list item.
    const sentence = (await screen.findAllByRole('listitem')).find((item) =>
      item.textContent.includes('is based on'),
    )
    if (sentence === undefined) throw new Error('The links lost their sentence')
    expect(sentence).toHaveTextContent(
      'Search with free hours is based on See who is free this week.',
    )
    // Each title opens the page of its item.
    const title = within(sentence).getByRole('link', {
      name: 'Search with free hours',
    })
    expect(title).toHaveAttribute('href', expect.stringContaining(`/projects/${projectId}/items/`))
  })

  it('opens the item page of a node on a click', async () => {
    const item = itemFixtureByKey(projectId, 'AR-003')
    const target = itemFixtureByKey(projectId, 'RAW-002')
    routerMock.push.mockClear()
    renderPage(item.id)

    const title = await screen.findByText('See who is free this week')
    // A mouse down that user-event sends carries no view, which the drag of React Flow reads when
    // a node is pressed and throws on in jsdom; the node answers to the click alone.
    fireEvent.click(title)

    await waitFor(() => {
      expect(routerMock.push).toHaveBeenCalledWith(
        expect.stringContaining(`/projects/${projectId}/items/${target.id}`),
      )
    })
  })
})
