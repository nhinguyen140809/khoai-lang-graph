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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setPathname } from '@/test/next-mocks.utils'
import { TestProviders } from '@/test/TestProviders'

import { PanelRegion } from '../../../panels/panel.constants'
import { usePanelsStore } from '../../../panels/panels.store'
import { useActivityBarStore } from '../../activity-bar.store'
import type { Destination } from '../../destination.types'
import { DestinationsContext } from '../../DestinationsContext'
import { useActivityBarItem } from '../../hooks/useActivityBarItem'
import { useSideFeatureStore } from '../../side-feature.store'
import { ActivityBar } from '../ActivityBar'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)

const destinations: Destination[] = [
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
  usePanelsStore.setState(usePanelsStore.getInitialState())
  useSideFeatureStore.setState(useSideFeatureStore.getInitialState())
  useActivityBarStore.setState(useActivityBarStore.getInitialState())
})

afterEach(() => {
  vi.restoreAllMocks()
})

function withActivities(given: Destination[]) {
  return function Providers({ children }: { children: ReactNode }) {
    return (
      <TestProviders>
        <DestinationsContext value={{ destinations: given, tabIcons: {} }}>
          {children}
        </DestinationsContext>
      </TestProviders>
    )
  }
}

const accountButton = <button type="button">Account</button>

/** Registers a stand-in of the account menu, as the account feature registers its own. */
function AccountItem() {
  useActivityBarItem({ content: accountButton })
  return null
}

function Broken(): never {
  throw new Error('The item failed.')
}

/** Registers an item whose content fails to render. */
function BrokenItem() {
  useActivityBarItem({ content: brokenContent })
  return null
}

const brokenContent = <Broken />

function renderBar(given: Destination[] = destinations) {
  render(
    <>
      <AccountItem />
      <ActivityBar />
    </>,
    { wrapper: withActivities(given) },
  )
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

    expect(useSideFeatureStore.getState().chosen).toBe('search')
    expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /^Console/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('hides and shows the side panel from the item of the panel on screen', async () => {
    renderBar()

    await userEvent.click(screen.getByRole('button', { name: /^Console/ }))
    expect(usePanelsStore.getState().panels[PanelRegion.Side].visible).toBe(false)

    await userEvent.click(screen.getByRole('button', { name: 'Artifacts' }))
    expect(usePanelsStore.getState().panels[PanelRegion.Side].visible).toBe(true)
    expect(useSideFeatureStore.getState().chosen).toBe('artifacts')
  })

  it('reads a badge with the name of its item', () => {
    renderBar()

    expect(screen.getByRole('button', { name: 'Console, 1 review waiting' })).toBeInTheDocument()
  })

  it('leaves out an item that fails to render, and keeps the others', () => {
    // React reports the error that the boundary catches.
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <>
        <BrokenItem />
        <AccountItem />
        <ActivityBar />
      </>,
      { wrapper: withActivities([]) },
    )

    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(['Account'])
  })

  it('shows the items registered with it only, without features', () => {
    renderBar([])

    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(['Account'])
  })
})
