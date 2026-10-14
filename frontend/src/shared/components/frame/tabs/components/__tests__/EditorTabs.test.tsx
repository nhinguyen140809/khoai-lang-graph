import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileTextIcon, PlayIcon, SearchIcon } from 'lucide-react'
import type { Route } from 'next'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { routerMock } from '@/test/next-mocks.utils'

import { ActivitiesContext } from '../../../activities/ActivitiesContext'
import type { Activity, TabIcons } from '../../../activities/activity.types'
import { useEditorTabsStore } from '../../editor-tabs.store'
import { EditorTabs } from '../EditorTabs'
import { ambiguity, closeTabCases, onScreenCases, req, tabIconCases } from './EditorTabs.data'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

const searchHref = '/projects/p1/search' as Route
const activities: Activity[] = [
  { id: 'search', label: 'Search', icon: <SearchIcon />, href: searchHref, panel: null },
]
const tabIcons: TabIcons = { artifact: <FileTextIcon />, run: <PlayIcon /> }

function Providers({ children }: { children: ReactNode }) {
  return <ActivitiesContext value={{ activities, tabIcons }}>{children}</ActivitiesContext>
}

function renderTabs(group: string) {
  render(<EditorTabs group={group} rootHref={searchHref} />, { wrapper: Providers })
}

beforeEach(() => {
  routerMock.push.mockClear()
  useEditorTabsStore.setState({
    ...useEditorTabsStore.getInitialState(),
    groups: { 'p1:search': [req, ambiguity] },
    onScreen: { 'p1:search': req.id },
  })
})

describe('EditorTabs', () => {
  it.each(onScreenCases)('lists $name', ({ group, tabs, onScreen, titles, current }) => {
    useEditorTabsStore.setState({ groups: { [group]: tabs }, onScreen: { [group]: onScreen } })
    renderTabs(group)

    const links = screen.getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual(titles)
    expect(
      links
        .filter((link) => link.getAttribute('aria-current') === 'page')
        .map((link) => link.textContent),
    ).toEqual([current])
  })

  it('names the preview tab as such, and keeps it on a double click', async () => {
    useEditorTabsStore.setState({ preview: { 'p1:search': ambiguity.id } })
    renderTabs('p1:search')

    const previewTab = screen.getByRole('link', { name: 'AMB-001, preview' })
    expect(previewTab.closest('li')).toHaveAttribute('data-preview', 'true')
    await userEvent.dblClick(previewTab)

    expect(useEditorTabsStore.getState().preview['p1:search']).toBeUndefined()
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
    await userEvent.click(screen.getByRole('menuitem', { name: 'Close other tabs' }))

    expect(useEditorTabsStore.getState().groups['p1:search']).toEqual([ambiguity])
    expect(routerMock.push).toHaveBeenCalledWith(ambiguity.href)
  })

  it('keeps a preview tab from its menu', async () => {
    useEditorTabsStore.setState({ preview: { 'p1:search': req.id } })
    renderTabs('p1:search')

    fireEvent.contextMenu(screen.getByRole('link', { name: 'REQ-001, preview' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Keep open' }))

    expect(useEditorTabsStore.getState().preview['p1:search']).toBeUndefined()
  })

  it('lists every open tab at the end of the strip, and closes them all from there', async () => {
    renderTabs('p1:search')

    await userEvent.click(screen.getByRole('button', { name: 'All open tabs' }))
    expect((await screen.findAllByRole('menuitem')).map((item) => item.textContent)).toEqual([
      'REQ-001',
      'AMB-001',
      'Close all tabs',
    ])
    await userEvent.click(screen.getByRole('menuitem', { name: 'AMB-001' }))
    expect(routerMock.push).toHaveBeenCalledWith(ambiguity.href)

    await userEvent.click(screen.getByRole('button', { name: 'All open tabs' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Close all tabs' }))
    expect(routerMock.push).toHaveBeenLastCalledWith(searchHref)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it.each(closeTabCases)('$name', async ({ tabs, onScreen, close, opens }) => {
    useEditorTabsStore.setState({
      groups: { 'p1:search': tabs },
      onScreen: { 'p1:search': onScreen },
    })
    renderTabs('p1:search')

    await userEvent.click(screen.getByRole('button', { name: `Close ${close}` }))

    expect(routerMock.push.mock.calls).toEqual(opens.map((href) => [href]))
    expect(screen.queryByRole('link', { name: close })).not.toBeInTheDocument()
  })

  it('closes a tab on middle click', () => {
    useEditorTabsStore.setState({ groups: { 'p1:search': [req] } })
    renderTabs('p1:search')

    fireEvent(
      screen.getByRole('link', { name: 'REQ-001' }),
      new MouseEvent('auxclick', { bubbles: true, button: 1 }),
    )

    expect(routerMock.push).toHaveBeenCalledWith('/projects/p1/search')
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it.each(tabIconCases)('shows $name as the icon of a tab', ({ tab, icon }) => {
    useEditorTabsStore.setState({ groups: { 'p1:search': [tab] } })
    renderTabs('p1:search')

    expect(
      screen.getByRole('link', { name: tab.title }).querySelector(`svg.${icon}`),
    ).toBeInTheDocument()
  })
})
