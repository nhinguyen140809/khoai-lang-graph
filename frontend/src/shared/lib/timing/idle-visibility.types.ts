/** What a caller may set on `useIdleVisibility`. */
export interface IdleVisibilityOptions {
  /** How long the container may go without an action of the user before the control hides. */
  idleMs: number
  /**
   * The events of the container that count as an action of the user. The pointer, a touch, a key, a
   * wheel and a scroll by default. The events are heard in the capture phase, so one that does not
   * bubble, such as a scroll, counts when it happens in an element inside the container.
   */
  events?: readonly string[]
  /** Whether the control is shown when it mounts; true by default. A hidden one waits for an action. */
  isInitiallyShown?: boolean
}

/** The props of a control that keeps itself shown while the pointer or the focus is on it. */
export interface IdleHoldProps {
  onPointerEnter: () => void
  onPointerLeave: () => void
  onFocus: () => void
  onBlur: () => void
}
