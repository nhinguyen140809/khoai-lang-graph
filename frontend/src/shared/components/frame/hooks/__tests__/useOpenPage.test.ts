import { renderHook } from '@testing-library/react'
import type { Route } from 'next'
import { createElement, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { routerMock } from '@/test/next-stubs/next-stubs.utils'

import type { Destination } from '../../destinations/destination.types'
import { DestinationsContext } from '../../destinations/hooks/useDestinations'
import { useSideFeatureStore } from '../../destinations/side-feature.store'
import { PanelRegion } from '../../panels/panel.types'
import { usePanelsStore } from '../../panels/panels.store'
import { useEditorTabsStore } from '../../tabs/editor-tabs.store'
import { useOpenPage } from '../useOpenPage'
import { openPageCases } from './useOpenPage.data'

const destinations: Destination[] = [
  {
    id: 'artifacts',
    label: 'Artifacts',
    icon: null,
    href: '/projects/p1/artifacts' as Route,
    panel: null,
  },
]

function wrapper({ children }: { children: ReactNode }) {
  return createElement(DestinationsContext, { value: { destinations, tabIcons: {} } }, children)
}

describe('useOpenPage', () => {
  it.each(openPageCases)('opens $name', ({ href, options, chosen, sideVisible, keepNext }) => {
    usePanelsStore.getState().togglePanel(PanelRegion.Side)
    const { result } = renderHook(() => useOpenPage(), { wrapper })

    result.current(href, options)

    expect(routerMock.push).toHaveBeenCalledExactlyOnceWith(href)
    expect(useSideFeatureStore.getState().chosen).toBe(chosen)
    expect(usePanelsStore.getState().panels[PanelRegion.Side].visible).toBe(sideVisible)
    expect(useEditorTabsStore.getState().keepNext).toBe(keepNext)
  })
})
