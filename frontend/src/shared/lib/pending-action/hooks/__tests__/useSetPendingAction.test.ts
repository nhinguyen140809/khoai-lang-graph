import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createPendingActionStore } from '../../pending-action.store'
import { usePendingAction, useSetPendingAction } from '../useSetPendingAction'

describe('useSetPendingAction and usePendingAction', () => {
  it('gives the target and the state of the dialog that useSetPendingAction opens', () => {
    const store = createPendingActionStore()
    const { result } = renderHook(() => ({
      open: useSetPendingAction(store),
      dialog: usePendingAction(store),
    }))
    expect(result.current.dialog).toMatchObject({ targetId: null, open: false })

    act(() => {
      result.current.open('p1')
    })
    expect(result.current.dialog).toMatchObject({ targetId: 'p1', open: true })

    act(() => {
      result.current.dialog.setOpen(false)
      result.current.dialog.closed()
    })
    expect(result.current.dialog).toMatchObject({ targetId: null, open: false })
  })

  it('gives the same action while the dialog opens and closes', () => {
    const store = createPendingActionStore()
    const { result } = renderHook(() => useSetPendingAction(store))
    const first = result.current

    act(() => {
      first('p1')
    })

    expect(result.current).toBe(first)
  })
})
