import { useSyncExternalStore } from 'react'

import { useFrameStore } from '../frame.store'

const subscribe = (onChange: () => void) => useFrameStore.persist.onFinishHydration(onChange)
const hasHydrated = () => useFrameStore.persist.hasHydrated()
const onServer = () => false

/** False until the frame sizes have been read from localStorage (AppFrame reads them). */
export function useFrameHydrated(): boolean {
  return useSyncExternalStore(subscribe, hasHydrated, onServer)
}
