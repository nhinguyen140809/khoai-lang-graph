import type { ByView, View } from './view.types'

/** The value of a view: its own, or the one of the developer view when it has none. */
export function inView<T>(value: ByView<T>, view: View): T {
  return view === 'user' && value.user !== undefined ? value.user : value.developer
}
