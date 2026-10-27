/**
 * An action that waits for the user on one thing, such as Delete project: one on the screen,
 * whatever starts it. The state holds the id of the thing only; the dialog that asks reads the
 * thing from the queries.
 */
export interface PendingActionState<Id extends string = string> {
  /**
   * The thing of the dialog, while it is open. It stays while the dialog closes, so that it closes
   * with its animation, and goes once it has closed.
   */
  targetId: Id | null
  open: boolean
  openDialog: (targetId: Id) => void
  setOpen: (open: boolean) => void
  closed: () => void
}

/** The hook of the store of a dialog, as `create` of zustand gives it: it reads from the state. */
export type PendingActionStore<Id extends string = string> = <T>(
  select: (state: PendingActionState<Id>) => T,
) => T
