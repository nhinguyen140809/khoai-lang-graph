/** An action that asks first, as `itAsksBeforeAction` needs to know it. */
export interface AsksBeforeActionCase {
  /** What the action is, in the names of the tests, such as "deleting a project". */
  action: string
  /**
   * Renders the screen, starts the action and returns its dialog. It also installs what `hasRun`
   * reads, since each test starts from it.
   */
  open: () => Promise<HTMLElement>
  /** The words of the button that runs the action. */
  confirmLabel: string
  /** Whether the action has reached its end: the request arrived, or the effect happened. */
  hasRun: () => boolean
  /**
   * The control that opened the dialog, when it stays on the screen after the dialog closes (a
   * trigger, not an item of a menu that closes). The focus goes back to it.
   */
  opener?: () => HTMLElement
  /** Makes the action fail, once the dialog is open. Leave it out when the action cannot fail. */
  fail?: () => void
}
