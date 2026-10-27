import { useSyncExternalStore } from 'react'

const subscribeNever = () => () => undefined
const isClient = () => true
const isServer = () => false

/**
 * False during server rendering and hydration, true afterwards. Use it to delay UI that depends
 * on browser-only state (stored theme, localStorage, window size), so the first client render
 * matches the server-rendered HTML.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(subscribeNever, isClient, isServer)
}
