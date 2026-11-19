import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SidebarProvider } from '@/shared/components/ui/sidebar'
import type * as urlModule from '@/shared/lib/url'
import { renderWithProviders } from '@/test/render'
import {
  confirmAction,
  findConfirmDialog,
  pressButton,
  pressMenuItem,
  waitForCall,
} from '@/test/steps'

import { SidebarAccountMenu } from '../SidebarAccountMenu'

const { reloadTo } = vi.hoisted(() => ({ reloadTo: vi.fn() }))

vi.mock('@/shared/lib/url', async (importOriginal) => ({
  ...(await importOriginal<typeof urlModule>()),
  reloadTo,
}))

function renderMenu() {
  renderWithProviders(
    <SidebarProvider>
      <SidebarAccountMenu />
    </SidebarProvider>,
  )
}

describe('SidebarAccountMenu', () => {
  it('shows the user across the row, and opens the menu above it with Settings', async () => {
    renderMenu()

    await pressButton(/Linh Pham/)

    const menu = screen.getByRole('menu')
    expect(menu).toHaveTextContent('linh.pham@example.com')
    expect(within(menu).getByRole('menuitem', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/settings',
    )
    expect(menu).toHaveAttribute('data-side', 'top')
  })

  it('logs out after asking, as the menu of the activity bar does', async () => {
    renderMenu()

    await pressButton(/Linh Pham/)
    await pressMenuItem('Log out')
    await confirmAction(await findConfirmDialog('Log out?'), 'Log out')

    await waitForCall(reloadTo, '/login')
  })
})
