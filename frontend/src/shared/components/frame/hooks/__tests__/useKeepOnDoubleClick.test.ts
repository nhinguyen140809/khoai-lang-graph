import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useEditorTabsStore } from '../../tabs/editor-tabs.store'
import { notePageOpen } from '../../tabs/last-page-open.utils'
import { useKeepOnDoubleClick } from '../useKeepOnDoubleClick'

function click(type: 'click' | 'dblclick', x: number, y: number) {
  document.body.dispatchEvent(
    new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, detail: 1 }),
  )
}

describe('useKeepOnDoubleClick', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useEditorTabsStore.setState({ pendingOpen: null })
  })

  it('keeps the page that the click before opened, wherever the second click lands', () => {
    renderHook(() => {
      useKeepOnDoubleClick()
    })

    click('click', 100, 200)
    notePageOpen('/projects/p1/items/i1')
    vi.advanceTimersByTime(150)
    click('click', 102, 201)
    click('dblclick', 102, 201)

    expect(useEditorTabsStore.getState().pendingOpen).toMatchObject({
      href: '/projects/p1/items/i1',
      keep: true,
    })
  })

  it('leaves a page opened by a key to the preview tab', () => {
    renderHook(() => {
      useKeepOnDoubleClick()
    })

    // Long after any click of the other tests, so that nothing opened this page by a click.
    vi.advanceTimersByTime(5000)
    notePageOpen('/projects/p1/items/i2')
    click('dblclick', 100, 200)

    expect(useEditorTabsStore.getState().pendingOpen).toBeNull()
  })

  it('leaves a double click far from the first click, or long after it, alone', () => {
    renderHook(() => {
      useKeepOnDoubleClick()
    })

    click('click', 100, 200)
    notePageOpen('/projects/p1/items/i3')
    click('dblclick', 400, 200)
    expect(useEditorTabsStore.getState().pendingOpen).toBeNull()

    vi.advanceTimersByTime(2000)
    click('dblclick', 100, 200)
    expect(useEditorTabsStore.getState().pendingOpen).toBeNull()
  })
})
