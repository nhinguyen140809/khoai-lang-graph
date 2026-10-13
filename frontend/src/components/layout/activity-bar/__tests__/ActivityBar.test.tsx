import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  FileStackIcon,
  FolderInputIcon,
  SearchIcon,
  SettingsIcon,
  SquareChevronRightIcon,
} from 'lucide-react'
import type { Route } from 'next'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setPathname } from '@/test/next-mocks.utils'
import { TestProviders } from '@/test/TestProviders'

import { useFrameStore } from '../../frame.store'
import { PanelRegion } from '../../panel.constants'
import { ActivitiesContext } from '../ActivitiesContext'
import type { Activity } from '../activity.types'
import { ActivityBar } from '../ActivityBar'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)

const activities: Activity[] = [
  {
    id: 'console',
    label: 'Console',
    icon: <SquareChevronRightIcon />,
    href: '/projects/p1/console' as Route,
    panel: null,
    badge: <span className="sr-only">, 1 review waiting</span>,
  },
  {
    id: 'search',
    label: 'Search',
    icon: <SearchIcon />,
    href: '/projects/p1/search' as Route,
    panel: null,
  },
  {
    id: 'artifacts',
    label: 'Artifacts',
    icon: <FileStackIcon />,
    href: '/projects/p1/artifacts' as Route,
    panel: null,
  },
  { id: 'sources', label: 'Sources', icon: <FolderInputIcon />, note: 'planned for later' },
  {
    id: 'settings',
    label: 'Settings',
    icon: <SettingsIcon />,
    placement: 'bottom',
    href: '/projects/p1/settings' as Route,
    panel: null,
  },
]

beforeEach(() => {
  setPathname('/projects/p1/console/t1')
  useFrameStore.setState(useFrameStore.getInitialState())
})

function withActivities(given: Activity[]) {
  return function Providers({ children }: { children: ReactNode }) {
    return (
      <TestProviders>
        <ActivitiesContext value={{ activities: given, tabIcons: {} }}>
          {children}
        </ActivitiesContext>
      </TestProviders>
    )
  }
}

function renderBar(given: Activity[] = activities) {
  render(<ActivityBar account={<button type="button">Account</button>} />, {
    wrapper: withActivities(given),
  })
}

describe('ActivityBar', () => {
  it('lists the features given to it, in order, and marks the one whose side panel is shown', () => {
    renderBar()

    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Console, 1 review waiting',
      'Search',
      'Artifacts',
      'Sources, planned for later',
      'Settings',
      'Account',
    ])
    // Until one is chosen, the side panel is the one of the page on screen.
    expect(screen.getByRole('button', { name: /^Console/ })).toHaveAttribute('aria-pressed', 'true')
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
    expect(screen.getByRole('button', { name: /^Console/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('hides and shows the side panel from the item of the panel on screen', async () => {
    renderBar()

    await userEvent.click(screen.getByRole('button', { name: /^Console/ }))
    expect(useFrameStore.getState().panels[PanelRegion.Side].visible).toBe(false)

    await userEvent.click(screen.getByRole('button', { name: 'Artifacts' }))
    expect(useFrameStore.getState().panels[PanelRegion.Side].visible).toBe(true)
    expect(useFrameStore.getState().sideFeature).toBe('artifacts')
  })

  it('reads a badge with the name of its item', () => {
    renderBar()

    expect(screen.getByRole('button', { name: 'Console, 1 review waiting' })).toBeInTheDocument()
  })

  it('shows the account menu only, without features', () => {
    renderBar([])

    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(['Account'])
  })
})
