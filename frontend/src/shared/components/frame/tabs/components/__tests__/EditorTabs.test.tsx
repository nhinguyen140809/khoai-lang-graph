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
const req = { id: 'i1', title: 'REQ-001', href: '/projects/p1/search/i1' }
const ambiguity = {
  id: 'i2',
  title: 'AMB-001',
  href: '/projects/p1/search/i2',
  icon: 'artifact',
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
  it('lists the open editors and marks the one on screen', () => {
    renderTabs('p1:search')

    expect(screen.getByRole('link', { name: 'REQ-001' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'AMB-001' })).not.toHaveAttribute('aria-current')
  })

  it('marks the tab of the page on screen, whatever its address holds', () => {
    useEditorTabsStore.setState({
      groups: {
        p1: [{ id: 'settings', title: 'Settings', href: '/projects/p1/settings?section=members' }],
      },
      onScreen: { p1: 'settings' },
    })
    renderTabs('p1')

    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('aria-current', 'page')
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

  it('shows the next tab after closing the tab on screen', async () => {
    renderTabs('p1:search')

    await userEvent.click(screen.getByRole('button', { name: 'Close REQ-001' }))

    expect(routerMock.push).toHaveBeenCalledWith(ambiguity.href)
    expect(screen.queryByRole('link', { name: 'REQ-001' })).not.toBeInTheDocument()
  })

  it('goes to the feature after closing the last tab, and closes a tab on middle click', () => {
    useEditorTabsStore.setState({ groups: { 'p1:search': [req] } })
    renderTabs('p1:search')

    fireEvent(
      screen.getByRole('link', { name: 'REQ-001' }),
      new MouseEvent('auxclick', { bubbles: true, button: 1 }),
    )

    expect(routerMock.push).toHaveBeenCalledWith('/projects/p1/search')
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('shows the icon that a tab names, else the icon of its feature, else a file', () => {
    useEditorTabsStore.setState({
      groups: {
        'p1:search': [req, ambiguity, { id: 'x', title: 'Elsewhere', href: '/projects/p1/other' }],
      },
    })
    renderTabs('p1:search')

    const reqTab = screen.getByRole('link', { name: 'REQ-001' })
    const ambiguityTab = screen.getByRole('link', { name: 'AMB-001' })
    const otherTab = screen.getByRole('link', { name: 'Elsewhere' })
    expect(reqTab.querySelector('svg.lucide-search')).toBeInTheDocument()
    expect(ambiguityTab.querySelector('svg.lucide-file-text')).toBeInTheDocument()
    expect(otherTab.querySelector('svg.lucide-file')).toBeInTheDocument()
  })

  it('keeps the tabs of every feature of a project in one strip', () => {
    useEditorTabsStore.setState({
      groups: {
        p1: [
          { id: 'console', title: 'Console', href: '/projects/p1/console' },
          { id: 'review:r1', title: 'Review', href: '/projects/p1/review/r1' },
          { id: 'run', title: 'Run 1', href: '/projects/p1/workflow/r1', icon: 'run' },
        ],
      },
      onScreen: { p1: 'run' },
    })
    renderTabs('p1')

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Console',
      'Review',
      'Run 1',
    ])
    expect(screen.getByRole('link', { name: 'Run 1' })).toHaveAttribute('aria-current', 'page')
  })

  it('does not navigate when a tab that is not on screen closes', async () => {
    renderTabs('p1:search')

    await userEvent.click(screen.getByRole('button', { name: 'Close AMB-001' }))

    expect(routerMock.push).not.toHaveBeenCalled()
  })
})
