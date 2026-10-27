import { act, renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { useEditorTabsStore } from '../../editor-tabs.store'
import type { EditorTab } from '../../editor-tabs.types'
import { useEditorTab } from '../useEditorTab'
import { TabGroupContext } from '../useTabGroup'
import { group, openedTabCases, requirement } from './useEditorTab.data'

/** Renders the hook inside the workspace of `tabGroup`, or outside any when it is null. */
function renderTab(tab: EditorTab | null, tabGroup: string | null = group) {
  return renderHook(({ current }) => useEditorTab(current), {
    initialProps: { current: tab },
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(TabGroupContext, { value: tabGroup }, children),
  })
}

describe('useEditorTab', () => {
  it.each(openedTabCases)('opens $name as the preview tab of its group', ({ tab, opened }) => {
    renderTab(tab)

    const state = useEditorTabsStore.getState()
    expect(state.groups[group]).toEqual([opened])
    expect(state.preview[group]).toBe(opened.id)
    expect(state.onScreen[group]).toBe(opened.id)
  })

  it('opens no tab outside a workspace with tabs', () => {
    renderTab(requirement, null)

    expect(useEditorTabsStore.getState().groups).toEqual({})
  })

  it('opens no tab while the title is not known yet', () => {
    renderTab(null)

    expect(useEditorTabsStore.getState().groups).toEqual({})
  })

  it('gives the open tab its new title instead of opening another', () => {
    const { rerender } = renderTab({ ...requirement, title: 'Loading' })

    rerender({ current: requirement })

    expect(useEditorTabsStore.getState().groups[group]).toEqual([requirement])
  })

  it('keeps the tab when the function it returns is called', () => {
    const { result } = renderTab(requirement)

    act(() => {
      result.current()
    })

    expect(useEditorTabsStore.getState().preview[group]).toBeUndefined()
  })

  it('keeps no tab through the function when there is no group', () => {
    const { result } = renderTab(requirement, null)

    act(() => {
      result.current()
    })

    expect(useEditorTabsStore.getState().preview).toEqual({})
  })

  it('leaves the screen with the page, and the tab stays open', () => {
    const { unmount } = renderTab(requirement)

    unmount()

    const state = useEditorTabsStore.getState()
    expect(state.groups[group]).toEqual([requirement])
    expect(state.onScreen[group]).toBeUndefined()
  })
})
