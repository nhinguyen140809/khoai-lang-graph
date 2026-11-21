import { describe, it } from 'vitest'

import { SidebarProvider } from '@/shared/components/ui/sidebar'
import { renderWithProviders } from '@/test/render'
import { expectNoText, expectRole, expectText } from '@/test/steps'

import { SidebarToggle } from '../SidebarToggle'

function renderToggle({ isOpen }: { isOpen: boolean }) {
  renderWithProviders(
    <SidebarProvider open={isOpen}>
      <SidebarToggle restingMark={<span>mark</span>} />
    </SidebarProvider>,
  )
}

describe('SidebarToggle', () => {
  it('shows the mark that it is given while the side list is folded to its rail', async () => {
    renderToggle({ isOpen: false })

    await expectRole('button', 'Show the sidebar')
    await expectText('mark')
  })

  it('shows its icon alone while the side list is open', async () => {
    renderToggle({ isOpen: true })

    await expectRole('button', 'Hide the sidebar')
    expectNoText('mark')
  })
})
