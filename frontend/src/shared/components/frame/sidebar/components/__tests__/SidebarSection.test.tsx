import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SidebarProvider } from '@/shared/components/ui/sidebar'
import { TooltipProvider } from '@/shared/components/ui/tooltip'
import { expectNoText, expectText, pressButton } from '@/test/steps'

import { SidebarSection, SidebarSectionAction } from '../SidebarSection'

function renderSection(isOpenAtFirst?: boolean) {
  const onCreate = vi.fn()
  render(
    <TooltipProvider>
      <SidebarProvider>
        <SidebarSection
          title="Projects"
          defaultOpen={isOpenAtFirst}
          action={
            <SidebarSectionAction label="Create project" onClick={onCreate}>
              +
            </SidebarSectionAction>
          }
        >
          <p>Mentor platform</p>
        </SidebarSection>
      </SidebarProvider>
    </TooltipProvider>,
  )
  return { onCreate }
}

describe('SidebarSection', () => {
  it('folds and unfolds its content from its title', async () => {
    renderSection()
    const title = screen.getByRole('button', { name: 'Projects' })

    expect(title).toHaveAttribute('aria-expanded', 'true')
    await expectText('Mentor platform')
    await userEvent.click(title)
    expect(title).toHaveAttribute('aria-expanded', 'false')
    expectNoText('Mentor platform')
  })

  it('starts folded when it is asked to', () => {
    renderSection(false)

    expect(screen.getByRole('button', { name: 'Projects' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('runs its action, named for assistive technology', async () => {
    const { onCreate } = renderSection()

    await pressButton(/Create project/)

    expect(onCreate).toHaveBeenCalledOnce()
  })
})
