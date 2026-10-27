/** An action that shows a toast when it ends, and the toast it shows. */
export interface ToastResultCase {
  name: string
  /** Renders the hook in the test and starts the action. */
  start: () => Promise<void> | void
  /** Makes the server refuse the action. Leave it out for an action that succeeds. */
  refuse?: () => void
  /** The kind of toast that shows, `success` after a success and `error` after a refusal. */
  kind: 'success' | 'error'
  message: string
  /** The options of the toast that matter to the case, such as its `duration` or `description`. */
  options?: Record<string, unknown>
}
