import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SidebarProvider } from '@/shared/components/ui/sidebar'
import { renderWithProviders } from '@/test/render'
import { expectRole } from '@/test/steps'

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
    expect(screen.getByText('mark')).toBeInTheDocument()
  })

  it('shows its icon alone while the side list is open', async () => {
    renderToggle({ isOpen: true })

    await expectRole('button', 'Hide the sidebar')
    expect(screen.queryByText('mark')).not.toBeInTheDocument()
  })
})
