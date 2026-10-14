import { render, renderHook, waitFor } from '@testing-library/react'
import type { Route } from 'next'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { browserStorage } from '@/shared/lib/browser-storage.utils'
import { setPathname } from '@/test/next-mocks.utils'

import type { Activity } from '../../activities/activity.types'
import { useSideFeatureStore } from '../../activities/side-feature.store'
import { usePanelsStore } from '../../panels/panels.store'
import { useEditorTabsStore } from '../../tabs/editor-tabs.store'
import { useEditorTab } from '../../tabs/hooks/useEditorTab'
import { useRestoreFrame } from '../useRestoreFrame'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)

const SIDE_FEATURE_KEY = useSideFeatureStore.persist.getOptions().name ?? ''
const TABS_KEY = useEditorTabsStore.persist.getOptions().name ?? ''

function feature(id: string): Activity {
  return { id, label: id, icon: null, href: `/projects/p1/${id}` as Route, panel: null }
}

const activities = [feature('console'), feature('search'), feature('artifacts')]

beforeEach(() => {
  browserStorage.removeItem(SIDE_FEATURE_KEY)
  browserStorage.removeItem(TABS_KEY)
  setPathname('/projects/p1/artifacts')
  usePanelsStore.setState(usePanelsStore.getInitialState())
  useSideFeatureStore.setState(useSideFeatureStore.getInitialState())
  useEditorTabsStore.setState(useEditorTabsStore.getInitialState())
})

describe('useRestoreFrame', () => {
  it('reads the stored state of the panels, the side feature and the tabs', async () => {
    renderHook(() => {
      useRestoreFrame(activities)
    })

    await waitFor(() => {
      expect(usePanelsStore.persist.hasHydrated()).toBe(true)
    })
    expect(useSideFeatureStore.persist.hasHydrated()).toBe(true)
    expect(useEditorTabsStore.persist.hasHydrated()).toBe(true)
  })

  it('keeps the side panel of the page on screen when no feature was chosen', async () => {
    renderHook(() => {
      useRestoreFrame(activities)
    })

    await waitFor(() => {
      expect(useSideFeatureStore.getState().chosen).toBe('artifacts')
    })
  })

  it('leaves the feature that the user chose before', async () => {
    browserStorage.setItem(
      SIDE_FEATURE_KEY,
      JSON.stringify({ state: { chosen: 'search' }, version: 0 }),
    )

    renderHook(() => {
      useRestoreFrame(activities)
    })

    await waitFor(() => {
      expect(useSideFeatureStore.getState().chosen).toBe('search')
    })
  })

  it('reads the stored tabs before a page opens its tab', () => {
    const stored = { id: 'a', title: 'a', href: '/projects/p1/artifacts/a' }
    browserStorage.setItem(
      TABS_KEY,
      JSON.stringify({ state: { groups: { p1: [stored] } }, version: 0 }),
    )
    function Page() {
      useEditorTab('p1', { id: 'b', title: 'b', href: '/projects/p1/artifacts/b' })
      return null
    }
    function Frame({ children }: { children: ReactNode }) {
      useRestoreFrame(activities)
      return children
    }

    render(createElement(Frame, null, createElement(Page)))

    expect(useEditorTabsStore.getState().groups.p1?.map(({ id }) => id)).toEqual(['a', 'b'])
  })
})
