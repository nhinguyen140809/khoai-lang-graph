import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useEditorTabsStore } from '../../editor-tabs.store'
import { useEditorTab } from '../useEditorTab'

const review = { id: 'review:r1', title: 'Review', href: '/projects/p1/review/r1' }

beforeEach(() => {
  useEditorTabsStore.setState(useEditorTabsStore.getInitialState())
})

describe('useEditorTab', () => {
  it('opens the tab of the page, and closes it with close', () => {
    const { result } = renderHook(() => useEditorTab('p1', review))
    expect(useEditorTabsStore.getState().groups.p1).toEqual([review])

    act(() => {
      result.current.close()
    })

    expect(useEditorTabsStore.getState().groups.p1).toEqual([])
  })
})
