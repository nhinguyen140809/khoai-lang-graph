import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MessageSquareIcon } from 'lucide-react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { routerMock, setPathname } from '@/test/next-mocks.utils'

import { featureHref } from '../activity-bar.config'
import { useEditorTabsStore } from '../editor-tabs.store'
import { EditorTabs } from '../EditorTabs'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)
vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

const chatHref = featureHref('p1', 'chat')
const main = { id: 't1', title: 'Main thread', href: '/projects/p1/chat/t1' }
const booking = {
  id: 't2',
  title: 'Booking rules',
  href: '/projects/p1/chat/t2',
  icon: 'thread' as const,
}

beforeEach(() => {
  routerMock.push.mockClear()
  useEditorTabsStore.setState({ groups: { 'p1:chat': [main, booking] }, lastHrefs: {} })
  setPathname(main.href)
})

describe('EditorTabs', () => {
  it('lists the open editors and marks the one on screen', () => {
    render(<EditorTabs group="p1:chat" rootHref={chatHref} defaultIcon={MessageSquareIcon} />)

    expect(screen.getByRole('link', { name: 'Main thread' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Booking rules' })).not.toHaveAttribute('aria-current')
  })

  it('shows the next tab after closing the tab on screen', async () => {
    render(<EditorTabs group="p1:chat" rootHref={chatHref} defaultIcon={MessageSquareIcon} />)

    await userEvent.click(screen.getByRole('button', { name: 'Close Main thread' }))

    expect(routerMock.push).toHaveBeenCalledWith(booking.href)
    expect(screen.queryByRole('link', { name: 'Main thread' })).not.toBeInTheDocument()
  })

  it('goes to the feature after closing the last tab, and closes a tab on middle click', () => {
    useEditorTabsStore.setState({ groups: { 'p1:chat': [main] } })
    render(<EditorTabs group="p1:chat" rootHref={chatHref} defaultIcon={MessageSquareIcon} />)

    fireEvent(
      screen.getByRole('link', { name: 'Main thread' }),
      new MouseEvent('auxclick', { bubbles: true, button: 1 }),
    )

    expect(routerMock.push).toHaveBeenCalledWith('/projects/p1/chat')
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('shows the icon of what a tab shows, else the icon of the feature', () => {
    render(<EditorTabs group="p1:chat" rootHref={chatHref} defaultIcon={MessageSquareIcon} />)

    const mainTab = screen.getByRole('link', { name: 'Main thread' })
    const bookingTab = screen.getByRole('link', { name: 'Booking rules' })
    expect(mainTab.querySelector('svg.lucide-message-square')).toBeInTheDocument()
    expect(bookingTab.querySelector('svg.lucide-message-square-text')).toBeInTheDocument()
  })

  it('does not navigate when a tab that is not on screen closes', async () => {
    render(<EditorTabs group="p1:chat" rootHref={chatHref} defaultIcon={MessageSquareIcon} />)

    await userEvent.click(screen.getByRole('button', { name: 'Close Booking rules' }))

    expect(routerMock.push).not.toHaveBeenCalled()
  })
})
