import { act, render, screen } from '@testing-library/react'
import type { Route } from 'next'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setPathname } from '@/test/next-mocks.utils'

import { ActivitiesContext } from '../../activities/ActivitiesContext'
import type { Activity } from '../../activities/activity.types'
import { useSideFeatureStore } from '../../activities/side-feature.store'
import { SidePanel } from '../../panels/components/SidePanel'
import { usePanelsStore } from '../../panels/panels.store'
import { PageWorkspace } from '../PageWorkspace'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)

const activities: Activity[] = [
  {
    id: 'settings',
    label: 'Settings',
    icon: null,
    placement: 'bottom',
    href: '/settings' as Route,
    panel: <SidePanel title="Settings">sections</SidePanel>,
  },
]

beforeEach(() => {
  usePanelsStore.setState(usePanelsStore.getInitialState())
  useSideFeatureStore.setState(useSideFeatureStore.getInitialState())
})

function renderPageWorkspace() {
  render(
    <ActivitiesContext value={{ activities, tabIcons: {} }}>
      <PageWorkspace>
        <p>page</p>
      </PageWorkspace>
    </ActivitiesContext>,
  )
}

describe('PageWorkspace', () => {
  it('gives the whole room to a page that belongs to no feature', () => {
    setPathname('/projects')
    renderPageWorkspace()

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('page')
  })

  it('shows the side panel of the page on screen', () => {
    setPathname('/settings')
    renderPageWorkspace()

    expect(screen.getByRole('complementary', { name: 'Settings' })).toBeInTheDocument()
  })

  it('shows the side panel of the feature chosen beside any page', () => {
    setPathname('/projects')
    renderPageWorkspace()

    act(() => {
      useSideFeatureStore.getState().choose('settings')
    })

    expect(screen.getByRole('complementary', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveTextContent('page')
  })
})
