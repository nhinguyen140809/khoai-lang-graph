/** A query hook called with `isEnabled: false`. */
export interface DisabledHookCase {
  name: string
  useHook: () => { fetchStatus: string }
}
