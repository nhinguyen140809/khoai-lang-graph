import { renderHook, waitFor } from '@testing-library/react'
import type { Route } from 'next'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { browserStorage } from '@/shared/lib/browser-storage.utils'
import { setPathname } from '@/test/next-mocks.utils'

import type { Activity } from '../../activities/activity.types'
import { useSideFeatureStore } from '../../activities/side-feature.store'
import { usePanelsStore } from '../../panels/panels.store'
import { useEditorTabsStore } from '../../tabs/editor-tabs.store'
import { useRestoreFrame } from '../useRestoreFrame'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)

const SIDE_FEATURE_KEY = useSideFeatureStore.persist.getOptions().name ?? ''

function feature(id: string): Activity {
  return { id, label: id, icon: null, href: `/projects/p1/${id}` as Route, panel: null }
}

const activities = [feature('console'), feature('search'), feature('artifacts')]

beforeEach(() => {
  browserStorage.removeItem(SIDE_FEATURE_KEY)
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
})
