import { describe, expect, it } from 'vitest'

import { createPendingActionStore } from '../pending-action.store'

describe('createPendingActionStore', () => {
  const makeStore = () => createPendingActionStore()

  it('starts closed, without a target', () => {
    expect(makeStore().getState()).toMatchObject({ targetId: null, open: false })
  })

  it('opens on a target', () => {
    const store = makeStore()

    store.getState().openDialog('p1')

    expect(store.getState()).toMatchObject({ targetId: 'p1', open: true })
  })

  it('keeps the target while the dialog closes, and forgets it once it has closed', () => {
    const store = makeStore()
    store.getState().openDialog('p1')

    store.getState().setOpen(false)
    expect(store.getState()).toMatchObject({ targetId: 'p1', open: false })

    store.getState().closed()
    expect(store.getState()).toMatchObject({ targetId: null, open: false })
  })

  it('gives each store a state of its own', () => {
    const first = makeStore()
    const second = makeStore()

    first.getState().openDialog('p1')

    expect(second.getState()).toMatchObject({ targetId: null, open: false })
  })

  it('moves to another target when it is opened again', () => {
    const store = makeStore()
    store.getState().openDialog('p1')

    store.getState().openDialog('p2')

    expect(store.getState()).toMatchObject({ targetId: 'p2', open: true })
  })
})
