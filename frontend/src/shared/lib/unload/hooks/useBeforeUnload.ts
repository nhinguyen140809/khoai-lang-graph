'use client'

import { useEffect } from 'react'

/**
 * Makes the browser ask before the page is reloaded or closed, while `isEnabled`: for text or files
 * that this page holds and that the leaving would lose. The browser words the question itself, and
 * asks only of a page that the user has used. Leaving the page for another page of the app does not
 * reload it, so it asks nothing then.
 */
export function useBeforeUnload(isEnabled: boolean) {
  useEffect(() => {
    if (!isEnabled) return
    const ask = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', ask)
    return () => {
      window.removeEventListener('beforeunload', ask)
    }
  }, [isEnabled])
}
