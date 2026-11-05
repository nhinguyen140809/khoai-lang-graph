import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useEditingRecordStore } from '../../stores/editing-record.store'
import { useEditingActions, useIsEditing } from '../useEditingRecord'

const target = { type: 'item' as const, id: 'item-1' }

describe('useIsEditing', () => {
  it('tells whether its record is edited, and the edit mode ends when the page unmounts', () => {
    useEditingRecordStore.getState().startEditing(target)
    const first = renderHook(() => useIsEditing(target))
    const other = renderHook(() => useIsEditing({ type: 'item', id: 'item-2' }))

    expect(first.result.current).toBe(true)
    expect(other.result.current).toBe(false)

    first.unmount()
    expect(useEditingRecordStore.getState().recordKey).toBeNull()
  })

  it('names the record whose edit ended, once, for its Edit button to take the focus', () => {
    const { result } = renderHook(() => useEditingActions())

    act(() => {
      result.current.startEditing(target)
    })
    expect(useEditingRecordStore.getState().recordKey).toBe('item:item-1')

    act(() => {
      result.current.stopEditing()
    })
    expect(useEditingRecordStore.getState().recordKey).toBeNull()
    expect(useEditingRecordStore.getState().endedKey).toBe('item:item-1')

    act(() => {
      useEditingRecordStore.getState().focusReturned()
    })
    expect(useEditingRecordStore.getState().endedKey).toBeNull()
  })
})
