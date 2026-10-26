import { useSyncExternalStore } from 'react'

// The width under which the screen counts as a phone.
const mobileBreakpoint = 768
const mobileQuery = `(max-width: ${String(mobileBreakpoint - 1)}px)`

function subscribe(onChange: () => void) {
  const query = window.matchMedia(mobileQuery)
  query.addEventListener('change', onChange)
  return () => {
    query.removeEventListener('change', onChange)
  }
}

const isMobileOnClient = () => window.matchMedia(mobileQuery).matches
const isMobileOnServer = () => false

/** Whether the screen is narrower than a tablet; false while the page renders on the server. */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, isMobileOnClient, isMobileOnServer)
}
