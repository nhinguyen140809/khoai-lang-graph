import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { frameWrapper } from '../../../__tests__/frame-wrapper.utils.data'
import { tabsOf } from '../../../__tests__/tab-state.utils.data'
import { useEditorTabsStore } from '../../editor-tabs.store'
import type { EditorTab } from '../../editor-tabs.types'
import { useEditorTab } from '../useEditorTab'
import { group, openedTabCases, requirement } from './useEditorTab.data'

/** Renders the hook inside the workspace of `tabGroup`, or outside any when it is null. */
function renderTab(
  tab: EditorTab | null,
  tabGroup: string | null = group,
  options: { isTitleProvisional?: boolean } = {},
) {
  return renderHook(({ current }) => useEditorTab(current, options), {
    initialProps: { current: tab },
    wrapper: frameWrapper({ tabGroup }),
  })
}

describe('useEditorTab', () => {
  it.each(openedTabCases)('opens $name as the preview tab of its group', ({ tab, opened }) => {
    renderTab(tab)

    expect(tabsOf(group)).toMatchObject({ tabs: [opened], preview: opened.id, onScreen: opened.id })
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

    expect(tabsOf(group).tabs).toEqual([requirement])
  })

  it('opens a tab with a stand-in title while the page does not know its own', () => {
    renderTab({ ...requirement, title: 'Item' }, group, { isTitleProvisional: true })

    expect(tabsOf(group).tabs).toEqual([{ ...requirement, title: 'Item' }])
  })

  it('keeps the title of a tab that is open when the page opens it with a stand-in title', () => {
    useEditorTabsStore.getState().openTab(group, requirement)

    renderTab({ ...requirement, title: 'Item' }, group, { isTitleProvisional: true })

    expect(tabsOf(group).tabs).toEqual([requirement])
  })

  it('keeps the tab when the function it returns is called', () => {
    const { result } = renderTab(requirement)

    act(() => {
      result.current()
    })

    expect(tabsOf(group).preview).toBeNull()
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

    expect(tabsOf(group)).toMatchObject({ tabs: [requirement], onScreen: null })
  })
})
