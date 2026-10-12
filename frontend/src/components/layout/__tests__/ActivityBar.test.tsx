import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setPathname } from '@/test/next-mocks.utils'
import { TestProviders } from '@/test/TestProviders'

import { ActivityBar } from '../ActivityBar'
import { useFrameStore } from '../frame.store'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)

beforeEach(() => {
  setPathname('/projects/p1/console/t1')
  useFrameStore.setState({ sidePanelVisible: true, sideFeature: null })
})

function renderBar() {
  render(<ActivityBar user={<button type="button">Account</button>} projectId="p1" />, {
    wrapper: TestProviders,
  })
}

describe('ActivityBar', () => {
  it('lists every feature of the project and marks the one whose side panel is shown', () => {
    renderBar()

    // Until one is chosen, the side panel is the one of the page on screen.
    expect(screen.getByRole('button', { name: 'Console' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Artifacts' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: /Sources/ })).toHaveAttribute('aria-disabled', 'true')
  })

  it('shows the side panel of a feature without leaving the page on screen', async () => {
    renderBar()

    await userEvent.click(screen.getByRole('button', { name: 'Search' }))

    expect(useFrameStore.getState().sideFeature).toBe('search')
    expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Console' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('hides and shows the side panel from the item of the panel on screen', async () => {
    renderBar()

    await userEvent.click(screen.getByRole('button', { name: 'Console' }))
    expect(useFrameStore.getState().sidePanelVisible).toBe(false)

    await userEvent.click(screen.getByRole('button', { name: 'Artifacts' }))
    expect(useFrameStore.getState().sidePanelVisible).toBe(true)
    expect(useFrameStore.getState().sideFeature).toBe('artifacts')
  })

  it('disables the features outside a project', () => {
    render(<ActivityBar user={<button type="button">Account</button>} />, {
      wrapper: TestProviders,
    })

    expect(screen.getByRole('button', { name: 'Account' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Console, select a project first/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it('shows a badge in the name of its item', () => {
    render(
      <ActivityBar
        projectId="p1"
        user={null}
        badges={{ console: <span className="sr-only">, 1 review waiting</span> }}
      />,
      { wrapper: TestProviders },
    )

    expect(screen.getByRole('button', { name: 'Console, 1 review waiting' })).toBeInTheDocument()
  })
})
