import { useShallow } from 'zustand/react/shallow'

import type { PendingActionStore } from '../pending-action.types'

/**
 * Opens the dialog of a store from a menu, a row or the command palette. It reads the action only,
 * so that the parts that open the dialog do not render again when it opens or closes.
 */
export function useSetPendingAction<Id extends string>(store: PendingActionStore<Id>) {
  return store((state) => state.openDialog)
}

/**
 * The dialog that `useSetPendingAction` opened: its target, whether it is open, and the actions
 * that close it and forget it once it has closed.
 */
export function usePendingAction<Id extends string>(store: PendingActionStore<Id>) {
  return store(
    useShallow(({ targetId, open, setOpen, closed }) => ({ targetId, open, setOpen, closed })),
  )
}
