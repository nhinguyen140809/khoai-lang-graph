import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { SidebarMenu, SidebarProvider } from '@/shared/components/ui/sidebar'
import { TooltipProvider } from '@/shared/components/ui/tooltip'

import { useCommandsStore } from '../../../commands/commands.store'
import { SidebarSearch } from '../SidebarSearch'

afterEach(() => {
  useCommandsStore.setState(useCommandsStore.getInitialState())
})

describe('SidebarSearch', () => {
  it('opens the command palette, and names the keys that open it too', async () => {
    render(
      <TooltipProvider>
        <SidebarProvider>
          <SidebarMenu>
            <SidebarSearch label="Search" />
          </SidebarMenu>
        </SidebarProvider>
      </TooltipProvider>,
    )
    const button = screen.getByRole('button', { name: /Search/ })
    // The browser of the tests is not an Apple device, so the modifier is Ctrl.
    expect(button).toHaveTextContent('SearchCtrlK')

    await userEvent.click(button)

    expect(useCommandsStore.getState().open).toBe(true)
  })
})
