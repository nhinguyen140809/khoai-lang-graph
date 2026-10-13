import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCommandsStore } from '../../../commands/commands.store'
import { TopBar } from '../TopBar'

vi.mock('next/link', async () => (await import('@/test/next-mocks.utils')).linkMock)

beforeEach(() => {
  useCommandsStore.setState({ open: false })
})

describe('TopBar', () => {
  it('shows where the user is, after a link to the home page', () => {
    render(<TopBar crumb="Settings" />)

    const trail = screen.getByRole('navigation', { name: 'breadcrumb' })
    expect(within(trail).getByRole('link', { name: 'khoai' })).toHaveAttribute('href', '/')
    expect(within(trail).getAllByRole('listitem')[1]).toHaveTextContent('Settings')
  })

  it('opens the command palette from the search box', async () => {
    render(<TopBar crumb="Projects" />)

    const search = screen.getByRole('button', { name: /Search or run a command/ })
    expect(search).toHaveAttribute('aria-keyshortcuts', 'Control+K Meta+K')
    expect(search).toHaveTextContent('CtrlK')

    await userEvent.click(search)

    expect(useCommandsStore.getState().open).toBe(true)
  })
})
