import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DropdownMenuItem } from '@/shared/components/ui/dropdown-menu'
import { SidebarMenu, SidebarProvider } from '@/shared/components/ui/sidebar'
import { routeOfAddress } from '@/shared/routes'
import { setPathname } from '@/test/next-stubs'
import { renderWithProviders } from '@/test/render'
import { expectNoRole, expectRole, pressButton } from '@/test/steps'

import { SidebarItemMenu, SidebarLinkItem } from '../SidebarLinkItem'

function renderItems() {
  renderWithProviders(
    <SidebarProvider>
      <SidebarMenu>
        <SidebarLinkItem
          href={routeOfAddress('/projects/a')}
          label="Mentor platform, Working"
          badge={<span>mark</span>}
          action={
            <SidebarItemMenu label="Actions for Mentor platform">
              <DropdownMenuItem>Rename</DropdownMenuItem>
            </SidebarItemMenu>
          }
        >
          <span>Mentor platform</span>
        </SidebarLinkItem>
        <SidebarLinkItem href={routeOfAddress('/recents')}>
          <span>View all</span>
        </SidebarLinkItem>
      </SidebarMenu>
    </SidebarProvider>,
  )
}

describe('SidebarLinkItem', () => {
  it('links to its page by its name, and marks the one on show', () => {
    setPathname('/recents')
    renderItems()

    const project = screen.getByRole('link', { name: 'Mentor platform, Working' })
    expect(project).toHaveAttribute('href', '/projects/a')
    expect(project).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: 'View all' })).toHaveAttribute('aria-current', 'page')
  })

  it('shows its mark apart from its name, and its menu', async () => {
    renderItems()

    // The name of the link says the mark already, so screen readers skip the mark itself.
    expect(screen.getByText('mark').closest('[aria-hidden="true"]')).not.toBeNull()
    expectNoRole('menuitem', 'Rename')
    await pressButton('Actions for Mentor platform')
    await expectRole('menuitem', 'Rename')
  })
})
