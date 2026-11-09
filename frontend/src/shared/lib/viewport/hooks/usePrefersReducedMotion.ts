import { useSyncExternalStore } from 'react'

const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  const query = window.matchMedia(reducedMotionQuery)
  query.addEventListener('change', onChange)
  return () => {
    query.removeEventListener('change', onChange)
  }
}

const isReducedOnClient = () => window.matchMedia(reducedMotionQuery).matches
const isReducedOnServer = () => false

/** Whether the user asked the system to reduce motion, so a page shortens or drops its animations; false while the page renders on the server. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, isReducedOnClient, isReducedOnServer)
}
