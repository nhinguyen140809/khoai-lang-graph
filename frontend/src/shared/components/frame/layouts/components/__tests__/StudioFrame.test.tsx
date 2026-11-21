import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TooltipProvider } from '@/shared/components/ui/tooltip'
import { routeOfAddress } from '@/shared/routes'
import { expectNoRole, expectRole } from '@/test/steps'

import { DeskBarItem } from '../../../bars/components/DeskBarItem'
import { DeskBarSide } from '../../../bars/desk-bar.types'
import { useDeskTool } from '../../../bars/hooks/useDeskTool'
import { StudioFrame } from '../StudioFrame'

/** Offers a tool, as a page does, and renders nothing in place. */
function Tool() {
  useDeskTool({
    id: 'documents',
    label: 'Documents',
    icon: <span />,
    isActive: false,
    onSelect: () => undefined,
  })
  return null
}

function renderFrame({ withTool = true } = {}) {
  render(
    <TooltipProvider>
      <StudioFrame
        homeHref={routeOfAddress('/')}
        sidebar={<nav aria-label="Projects" />}
        accountMenu={<button type="button">Account</button>}
        contributions={<div role="dialog" />}
      >
        {withTool && <Tool />}
        <DeskBarItem side={DeskBarSide.Left}>
          <p>Mentor platform</p>
        </DeskBarItem>
        <DeskBarItem side={DeskBarSide.Right}>
          <button type="button">Export</button>
        </DeskBarItem>
        <p>The chat</p>
      </StudioFrame>
    </TooltipProvider>,
  )
}

describe('StudioFrame', () => {
  it('shows the page across the width, with no side list', async () => {
    renderFrame()

    expect(screen.getByRole('main')).toHaveTextContent('The chat')
    expectNoRole('navigation', 'Projects')
    await expectRole('dialog')
  })

  it('shows the name of the app, the items of the page, the search and the account in the bar', () => {
    renderFrame()

    const bar = screen.getByRole('banner')
    expect(within(bar).getByRole('link', { name: 'khoai' })).toHaveAttribute('href', '/')
    expect(within(bar).getByText('Mentor platform')).toBeInTheDocument()
    expect(within(bar).getByRole('button', { name: /Search or run a command/ })).toBeInTheDocument()
    expect(within(bar).getByRole('button', { name: 'Export' })).toBeInTheDocument()
    expect(within(bar).getByRole('button', { name: 'Account' })).toBeInTheDocument()
  })

  it('keeps the tools of the page in a rail, not in the bar', () => {
    renderFrame()

    const rail = screen.getByRole('navigation', { name: 'Project tools' })
    expect(within(rail).getByRole('button', { name: 'Documents' })).toBeInTheDocument()
    expect(
      within(screen.getByRole('banner')).queryByRole('button', { name: 'Documents' }),
    ).toBeNull()
  })

  it('has no rail while the page offers no tool', () => {
    renderFrame({ withTool: false })

    expectNoRole('navigation', 'Project tools')
  })
})
