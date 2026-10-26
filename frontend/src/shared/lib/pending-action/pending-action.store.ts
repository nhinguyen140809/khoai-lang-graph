import { create } from 'zustand'

import type { PendingActionState } from './pending-action.types'

/** A store for a dialog that acts on one thing, opened from menus, rows and the command palette. */
export function createPendingActionStore<Id extends string = string>() {
  return create<PendingActionState<Id>>()((set) => ({
    targetId: null,
    open: false,
    openDialog: (targetId) => {
      set({ targetId, open: true })
    },
    setOpen: (open) => {
      set({ open })
    },
    closed: () => {
      set({ targetId: null, open: false })
    },
  }))
}
