import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
  itemFixtures,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { assertPresent } from '@/shared/lib/guards'
import { routerMock } from '@/test/next-stubs'
import { renderDocumentsFrame } from '@/test/render'
import { advanceTimers, expectNoAccessibilityViolations, expectText, pressKey } from '@/test/steps'

import { navigatorIdleMs } from '../../item-page.constants'
import { ItemPage } from '../ItemPage'

const projectId = projectIds.mentor
const analysis = artifactFixtureByKind(projectId, 'requirements_analysis')
const first = itemFixtureByKey(projectId, 'RAW-001')
const last = itemFixtures
  .filter((item) => item.artifact_id === analysis.id && item.kind === 'conflict')
  .at(-1)

function renderItem(itemId: string, scenario?: string) {
  return renderDocumentsFrame(<ItemPage projectId={projectId} itemId={itemId} />, {
    pathname: `/projects/${projectId}/items/${itemId}`,
    params: { itemId },
    ...(scenario !== undefined && { scenario }),
  })
}

/** The navigator over the page, once the page has the order of its document. */
async function findNavigator() {
  const navigator = await screen.findByRole('group', { name: 'Go through the items' })
  await screen.findByText(/^\d+ of \d+$/)
  return navigator
}

describe('ItemPage', () => {
  it('shows the breadcrumb, the title, the key line and the filled fields', async () => {
    renderItem(first.id)

    expect(
      await screen.findByRole('heading', { level: 1, name: /Find a mentor in my field/ }),
    ).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: analysis.title })).toHaveAttribute(
      'href',
      `/projects/${projectId}/documents/${analysis.id}`,
    )
    expect(screen.getByText('RAW-001')).toBeInTheDocument()
    expect(screen.queryByText('version 1')).not.toBeInTheDocument()
  })

  it('shows the page of a persona as a profile: its avatar, its fields of one line on the key line, its lists in pairs', async () => {
    renderItem(itemFixtureByKey(projectId, 'PER-001').id)

    const heading = await screen.findByRole('heading', { level: 1, name: 'Minh' })
    expect(heading.parentElement).toHaveTextContent('PER-001')
    // The avatar leads the title, in the tone of the place of the persona among the items.
    expect(screen.getByText('M')).toHaveAttribute('data-color', 'chart')
    // The fields of one line sit above the label of the status, under the title.
    const stakeholder = screen.getByText('Student').closest('p')
    expect(stakeholder?.textContent).toContain('Stakeholder type: Student')
    expect(screen.getByText('Interviewed')).toBeInTheDocument()
    expect(stakeholder?.compareDocumentPosition(screen.getByText(/Approved/))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    // The body holds the fields of the profile, a list in one column and a text across.
    const goals = screen.getByRole('heading', { name: 'Goals' }).closest('section')
    const background = screen.getByRole('heading', { name: 'Background' }).closest('section')
    expect(goals).not.toHaveAttribute('data-wide')
    expect(background).toHaveAttribute('data-wide')
    expect(screen.queryByRole('heading', { name: 'Name' })).not.toBeInTheDocument()
  })

  it('shows the sections and the group above the item in the breadcrumb, from the top down', async () => {
    const specification = artifactFixtureByKind(projectId, 'requirement_specification')
    renderItem(itemFixtureByKey(projectId, 'REQ-001').id)

    const trail = await screen.findByRole('navigation', { name: 'Where the item sits' })

    await waitFor(() => {
      expect(trail).toHaveTextContent(
        `${specification.title}/Functional requirements/Mentor discovery/Requirement/Search mentors`,
      )
    })
  })

  it('shows the label of the status of the item in the key line', async () => {
    renderItem(itemFixtureByKey(projectId, 'RAW-003').id)

    await waitFor(() => {
      expect(screen.getByText('Needs your review')).toHaveClass('text-(--tone-strong)')
    })
  })

  it('opens a tab titled with the item', async () => {
    renderItem(first.id)

    const strip = await screen.findByRole('navigation', { name: 'Open editors' })
    expect(await within(strip).findByText(/Find a mentor in my field/)).toBeInTheDocument()
  })

  it('gives the tab of an item the icon of the display of its kind', async () => {
    renderItem(first.id)

    const strip = await screen.findByRole('navigation', { name: 'Open editors' })
    await within(strip).findByText(/Find a mentor in my field/)
    await waitFor(() => {
      expect(strip.querySelector('svg.lucide-rows-2')).not.toBeNull()
    })
  })

  it('shows the place of the item among the items of the document', async () => {
    renderItem(first.id)

    await findNavigator()

    expect(screen.getByText(/^1 of \d+$/)).toBeInTheDocument()
  })

  it('disables Previous on the first item', async () => {
    renderItem(first.id)
    await findNavigator()

    expect(screen.getByRole('button', { name: 'Previous item' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next item' })).toBeEnabled()
  })

  it('disables Next on the last item', async () => {
    renderItem(last?.id ?? '')
    await findNavigator()

    expect(screen.getByRole('button', { name: 'Next item' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Previous item' })).toBeEnabled()
  })

  it('opens the next item in the place of the tab on screen', async () => {
    renderItem(first.id)
    await findNavigator()

    await userEvent.click(screen.getByRole('button', { name: 'Next item' }))

    expect(routerMock.push).toHaveBeenCalledWith(expect.stringMatching(/\/items\//))
  })

  it('goes to the next and the previous item with J and K', async () => {
    renderItem(first.id)
    await findNavigator()

    await pressKey('j')
    expect(routerMock.push).toHaveBeenCalledTimes(1)

    await pressKey('k')
    expect(routerMock.push).toHaveBeenCalledTimes(1)
  })

  it('shows a not found state for an item that does not exist', async () => {
    renderItem('missing-item')

    await expectText('Item not found')
  })

  it('shows a not found state for an item that is read in place in its document', async () => {
    renderItem(itemFixtureByKey(projectId, 'PER-001#1').id)

    await expectText('Item not found')
  })

  it('has no accessibility violation', async () => {
    const { container } = renderItem(first.id)
    await findNavigator()

    await expectNoAccessibilityViolations(container)
  })
})

describe('ItemPage navigator', () => {
  async function renderIdle() {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    renderItem(first.id)
    return findNavigator()
  }

  it('shows when the page opens and hides after a moment without action', async () => {
    const navigator = await renderIdle()
    expect(navigator).not.toHaveClass('opacity-0')

    advanceTimers(navigatorIdleMs + 100)

    expect(navigator).toHaveClass('opacity-0')
  })

  it.each([
    {
      name: 'a move of the pointer',
      fire: (page: HTMLElement) => page.dispatchEvent(new Event('pointermove', { bubbles: true })),
    },
    {
      name: 'a touch',
      fire: (page: HTMLElement) => page.dispatchEvent(new Event('touchstart', { bubbles: true })),
    },
    {
      name: 'a key',
      fire: (page: HTMLElement) => page.dispatchEvent(new Event('keydown', { bubbles: true })),
    },
    {
      name: 'a scroll',
      fire: (page: HTMLElement) =>
        page
          .querySelector('[data-slot="scroll-area-viewport"]')
          ?.dispatchEvent(new Event('scroll')),
    },
  ])('shows again on $name', async ({ fire }) => {
    const navigator = await renderIdle()
    advanceTimers(navigatorIdleMs + 100)
    expect(navigator).toHaveClass('opacity-0')

    act(() => {
      fire(assertPresent(navigator.parentElement, 'The navigator has no page'))
    })

    expect(navigator).not.toHaveClass('opacity-0')
  })

  it('stays while the pointer is over it, and hides after the pointer leaves', async () => {
    const navigator = await renderIdle()

    await userEvent.hover(navigator)
    advanceTimers(navigatorIdleMs * 2)
    expect(navigator).not.toHaveClass('opacity-0')

    await userEvent.unhover(navigator)
    advanceTimers(navigatorIdleMs + 100)
    expect(navigator).toHaveClass('opacity-0')
  })

  it('shows when Tab reaches a button of the hidden navigator', async () => {
    const navigator = await renderIdle()
    advanceTimers(navigatorIdleMs + 100)
    expect(navigator).toHaveClass('opacity-0')

    act(() => {
      screen.getByRole('button', { name: 'Next item' }).focus()
    })

    expect(navigator).not.toHaveClass('opacity-0')
  })
})
