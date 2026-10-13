import { renderHook } from '@testing-library/react'
import type { Route } from 'next'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { routerMock } from '@/test/next-mocks.utils'

import { useFrameStore } from '../../../frame.store'
import { PanelRegion } from '../../../panels/panel.constants'
import { useEditorTabsStore } from '../../../tabs/editor-tabs.store'
import { ActivitiesContext } from '../../ActivitiesContext'
import type { Activity } from '../../activity.types'
import { useOpenPage } from '../useOpenPage'

vi.mock('next/navigation', async () => (await import('@/test/next-mocks.utils')).navigationMock)

const activities: Activity[] = [
  {
    id: 'artifacts',
    label: 'Artifacts',
    icon: null,
    href: '/projects/p1/artifacts' as Route,
    panel: null,
  },
]

function wrapper({ children }: { children: ReactNode }) {
  return createElement(ActivitiesContext, { value: { activities, tabIcons: {} } }, children)
}

beforeEach(() => {
  routerMock.push.mockClear()
  useFrameStore.setState(useFrameStore.getInitialState())
  useEditorTabsStore.setState(useEditorTabsStore.getInitialState())
})

describe('useOpenPage', () => {
  it('opens the page and shows the side panel of its feature, even when hidden', () => {
    useFrameStore.getState().togglePanel(PanelRegion.Side)
    const { result } = renderHook(() => useOpenPage(), { wrapper })

    result.current('/projects/p1/artifacts?export=' as Route)

    expect(routerMock.push).toHaveBeenCalledWith('/projects/p1/artifacts?export=')
    expect(useFrameStore.getState().sideFeature).toBe('artifacts')
    expect(useFrameStore.getState().panels[PanelRegion.Side].visible).toBe(true)
  })

  it('opens a page that belongs to no feature, and leaves the side panel', () => {
    const { result } = renderHook(() => useOpenPage(), { wrapper })

    result.current('/')

    expect(routerMock.push).toHaveBeenCalledWith('/')
    expect(useFrameStore.getState().sideFeature).toBeNull()
  })

  it('asks to keep the tab of the page when told to keep it', () => {
    const { result } = renderHook(() => useOpenPage(), { wrapper })

    result.current('/projects/p1/artifacts/a1' as Route, { keep: true })

    expect(useEditorTabsStore.getState().keepNext).toBe('/projects/p1/artifacts/a1')
    expect(routerMock.push).toHaveBeenCalledWith('/projects/p1/artifacts/a1')
  })
})
