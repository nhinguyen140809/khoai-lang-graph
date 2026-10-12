import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { routerMock, setPathname } from '@/test/next-mocks.utils'

import { featureHref } from '../activity-bar.config'
import { useEditorTabsStore } from '../editor-tabs.store'
import { EditorTabs } from '../EditorTabs'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

const searchHref = featureHref('p1', 'search')
const req = { id: 'i1', title: 'REQ-001', href: '/projects/p1/search/i1' }
const ambiguity = {
  id: 'i2',
  title: 'AMB-001',
  href: '/projects/p1/search/i2',
  icon: 'item' as const,
}

beforeEach(() => {
  routerMock.push.mockClear()
  useEditorTabsStore.setState({ groups: { 'p1:search': [req, ambiguity] }, lastHrefs: {} })
  setPathname(req.href)
})

describe('EditorTabs', () => {
  it('lists the open editors and marks the one on screen', () => {
    render(<EditorTabs group="p1:search" rootHref={searchHref} />)

    expect(screen.getByRole('link', { name: 'REQ-001' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'AMB-001' })).not.toHaveAttribute('aria-current')
  })

  it('shows the next tab after closing the tab on screen', async () => {
    render(<EditorTabs group="p1:search" rootHref={searchHref} />)

    await userEvent.click(screen.getByRole('button', { name: 'Close REQ-001' }))

    expect(routerMock.push).toHaveBeenCalledWith(ambiguity.href)
    expect(screen.queryByRole('link', { name: 'REQ-001' })).not.toBeInTheDocument()
  })

  it('goes to the feature after closing the last tab, and closes a tab on middle click', () => {
    useEditorTabsStore.setState({ groups: { 'p1:search': [req] } })
    render(<EditorTabs group="p1:search" rootHref={searchHref} />)

    fireEvent(
      screen.getByRole('link', { name: 'REQ-001' }),
      new MouseEvent('auxclick', { bubbles: true, button: 1 }),
    )

    expect(routerMock.push).toHaveBeenCalledWith('/projects/p1/search')
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('shows the icon of what a tab shows, else the icon of the feature', () => {
    render(<EditorTabs group="p1:search" rootHref={searchHref} />)

    const reqTab = screen.getByRole('link', { name: 'REQ-001' })
    const ambiguityTab = screen.getByRole('link', { name: 'AMB-001' })
    expect(reqTab.querySelector('svg.lucide-search')).toBeInTheDocument()
    expect(ambiguityTab.querySelector('svg.lucide-file')).toBeInTheDocument()
  })

  it('keeps the tabs of every feature of a project in one strip', () => {
    useEditorTabsStore.setState({
      groups: {
        p1: [
          { id: 'console', title: 'Console', href: '/projects/p1/console', icon: 'console' },
          { id: 'review:r1', title: 'Review', href: '/projects/p1/review/r1', icon: 'review' },
          { id: 'run', title: 'Run 1', href: '/projects/p1/workflow/r1', icon: 'run' },
        ],
      },
      lastHrefs: {},
    })
    setPathname('/projects/p1/workflow/r1')
    render(<EditorTabs group="p1" rootHref={searchHref} />)

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Console',
      'Review',
      'Run 1',
    ])
    expect(screen.getByRole('link', { name: 'Run 1' })).toHaveAttribute('aria-current', 'page')
  })

  it('does not navigate when a tab that is not on screen closes', async () => {
    render(<EditorTabs group="p1:search" rootHref={searchHref} />)

    await userEvent.click(screen.getByRole('button', { name: 'Close AMB-001' }))

    expect(routerMock.push).not.toHaveBeenCalled()
  })
})
