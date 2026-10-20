import { render, renderHook, waitFor } from '@testing-library/react'
import type { Route } from 'next'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { browserStorage } from '@/shared/lib/browser-storage.utils'
import { setPathname } from '@/test/next-mocks.utils'

import type { Destination } from '../../destinations/destination.types'
import { useSideFeatureStore } from '../../destinations/side-feature.store'
import { usePanelsStore } from '../../panels/panels.store'
import { useEditorTabsStore } from '../../tabs/editor-tabs.store'
import { useEditorTab } from '../../tabs/hooks/useEditorTab'
import { TabGroupContext } from '../../tabs/hooks/useTabGroup'
import { useRestoreFrame } from '../useRestoreFrame'
import { chosenFeatureCases } from './useRestoreFrame.data'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)

const SIDE_FEATURE_KEY = useSideFeatureStore.persist.getOptions().name ?? ''
const TABS_KEY = useEditorTabsStore.persist.getOptions().name ?? ''

function feature(id: string): Destination {
  return { id, label: id, icon: null, href: `/projects/p1/${id}` as Route, panel: null }
}

const destinations = [feature('console'), feature('search'), feature('artifacts')]

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
      useRestoreFrame(destinations)
    })

    await waitFor(() => {
      expect(usePanelsStore.persist.hasHydrated()).toBe(true)
    })
    expect(useSideFeatureStore.persist.hasHydrated()).toBe(true)
    expect(useEditorTabsStore.persist.hasHydrated()).toBe(true)
  })

  it.each(chosenFeatureCases)('keeps $name', async ({ chosen, shows }) => {
    browserStorage.setItem(SIDE_FEATURE_KEY, JSON.stringify({ state: { chosen }, version: 0 }))

    renderHook(() => {
      useRestoreFrame(destinations)
    })

    await waitFor(() => {
      expect(useSideFeatureStore.getState().chosen).toBe(shows)
    })
  })

  it('reads the stored tabs before a page opens its tab', () => {
    const stored = { id: 'a', title: 'a', href: '/projects/p1/artifacts/a' }
    browserStorage.setItem(
      TABS_KEY,
      JSON.stringify({ state: { groups: { p1: [stored] } }, version: 0 }),
    )
    function Page() {
      useEditorTab({ id: 'b', title: 'b', href: '/projects/p1/artifacts/b' })
      return null
    }
    function Frame({ children }: { children: ReactNode }) {
      useRestoreFrame(destinations)
      return children
    }

    render(
      createElement(
        TabGroupContext,
        { value: 'p1' },
        createElement(Frame, null, createElement(Page)),
      ),
    )

    expect(useEditorTabsStore.getState().groups.p1?.map(({ id }) => id)).toEqual(['a', 'b'])
  })
})
