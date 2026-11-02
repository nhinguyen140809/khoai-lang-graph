import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileTextIcon, PlayIcon, SearchIcon } from 'lucide-react'
import type { Route } from 'next'
import { beforeEach, describe, expect, it } from 'vitest'

import { routerMock } from '@/test/next-stubs'
import { expectNoRole, expectPushedTo, pressButton, pressMenuItem } from '@/test/steps'

import { frameWrapper } from '../../../__tests__/frame-wrapper.utils.data'
import { seedTabs, tabsOf } from '../../../__tests__/tab-state.utils.data'
import type { Destination, TabIcons } from '../../../destinations/destination.types'
import { EditorTabs } from '../EditorTabs'
import {
  ambiguity,
  closeTabCases,
  onScreenCases,
  requirement,
  tabIconCases,
} from './EditorTabs.data'

const searchHref = '/projects/p1/search' as Route
const tabIcons: TabIcons = { artifact: <FileTextIcon />, run: <PlayIcon /> }
const destinations: Destination[] = [
  { id: 'search', label: 'Search', icon: <SearchIcon />, href: searchHref, panel: null },
]

/** The strip, in the workspace of `group`, or outside any workspace without one. */
function renderTabs(group?: string) {
  render(<EditorTabs rootHref={searchHref} />, {
    wrapper: frameWrapper({
      destinations,
      tabIcons,
      ...(group !== undefined && { tabGroup: group }),
    }),
  })
}

beforeEach(() => {
  seedTabs('p1:search', { tabs: [requirement, ambiguity], onScreen: requirement.id })
})

describe('EditorTabs', () => {
  it.each(onScreenCases)('lists $name', ({ group, tabs, onScreen, titles, current }) => {
    seedTabs(group, { tabs, onScreen })
    renderTabs(group)

    const links = screen.getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual(titles)
    expect(
      links
        .filter((link) => link.getAttribute('aria-current') === 'page')
        .map((link) => link.textContent),
    ).toEqual([current])
  })

  it('shows no strip outside a workspace with tabs', () => {
    renderTabs()

    expectNoRole('navigation')
  })

  it('names the preview tab as such, and keeps it on a double click', async () => {
    seedTabs('p1:search', { preview: ambiguity.id })
    renderTabs('p1:search')

    const previewTab = screen.getByRole('link', { name: 'AMB-001, preview' })
    expect(previewTab.closest('li')).toHaveAttribute('data-preview', 'true')
    await userEvent.dblClick(previewTab)

    expect(tabsOf('p1:search').preview).toBeNull()
    expect(screen.getByRole('link', { name: 'AMB-001' }).closest('li')).toHaveAttribute(
      'data-preview',
      'false',
    )
  })

  it('closes the other tabs from the menu of a tab, and shows the tab that stays', async () => {
    renderTabs('p1:search')

    fireEvent.contextMenu(screen.getByRole('link', { name: 'AMB-001' }))
    expect(await screen.findByRole('menuitem', { name: 'Keep open' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await pressMenuItem('Close other tabs')

    expect(tabsOf('p1:search').tabs).toEqual([ambiguity])
    await expectPushedTo(ambiguity.href)
  })

  it('keeps a preview tab from its menu', async () => {
    seedTabs('p1:search', { preview: requirement.id })
    renderTabs('p1:search')

    fireEvent.contextMenu(screen.getByRole('link', { name: 'REQ-001, preview' }))
    await pressMenuItem('Keep open')

    expect(tabsOf('p1:search').preview).toBeNull()
  })

  it('lists every open tab at the end of the strip, and closes them all from there', async () => {
    renderTabs('p1:search')

    await pressButton('All open tabs')
    expect((await screen.findAllByRole('menuitem')).map((item) => item.textContent)).toEqual([
      'REQ-001',
      'AMB-001',
      'Close all tabs',
    ])
    await pressMenuItem('AMB-001')
    await expectPushedTo(ambiguity.href)

    await pressButton('All open tabs')
    await pressMenuItem('Close all tabs')
    expect(routerMock.push).toHaveBeenLastCalledWith(searchHref)
    expectNoRole('navigation')
  })

  it.each(closeTabCases)('$name', async ({ tabs, onScreen, close, opens }) => {
    seedTabs('p1:search', { tabs, onScreen })
    renderTabs('p1:search')

    await pressButton(`Close ${close}`)

    expect(routerMock.push.mock.calls).toEqual(opens.map((href) => [href]))
    expectNoRole('link', close)
  })

  it('closes a tab on middle click', async () => {
    seedTabs('p1:search', { tabs: [requirement] })
    renderTabs('p1:search')

    fireEvent(
      screen.getByRole('link', { name: 'REQ-001' }),
      new MouseEvent('auxclick', { bubbles: true, button: 1 }),
    )

    await expectPushedTo('/projects/p1/search')
    expectNoRole('navigation')
  })

  it.each(tabIconCases)('shows $name as the icon of a tab', ({ tab, icon }) => {
    seedTabs('p1:search', { tabs: [tab] })
    renderTabs('p1:search')

    expect(
      screen.getByRole('link', { name: tab.title }).querySelector(`svg.${icon}`),
    ).toBeInTheDocument()
  })
})
