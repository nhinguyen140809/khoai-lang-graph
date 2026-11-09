import { act, renderHook } from '@testing-library/react'
import { PencilIcon } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import { useEditingRecordStore } from '../../stores/editing-record.store'
import { useEditRecordAction } from '../useEditRecordAction'

const target = { type: 'item' as const, id: 'item-1' }

describe('useEditRecordAction', () => {
  it('gives the icon and the words of Edit, with no reason when the record can change', () => {
    const { result } = renderHook(() => useEditRecordAction(target, null))

    expect(result.current.icon).toBe(PencilIcon)
    expect(result.current.label).toBe('Edit')
    expect(result.current.disabledReason).toBeNull()
  })

  it('carries the reason the record cannot change', () => {
    const { result } = renderHook(() =>
      useEditRecordAction(target, 'Only the documents under review can change now.'),
    )

    expect(result.current.disabledReason).toBe('Only the documents under review can change now.')
  })

  it('starts the edit mode of its record when it runs', () => {
    const { result } = renderHook(() => useEditRecordAction(target, null))

    act(() => {
      result.current.run()
    })

    expect(useEditingRecordStore.getState().recordKey).toBe('item:item-1')
  })
})
