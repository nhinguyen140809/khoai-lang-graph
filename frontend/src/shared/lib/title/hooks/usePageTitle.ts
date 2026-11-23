'use client'

import { useEffect } from 'react'

import { pageTitle } from '../title.utils'

/**
 * Names the tab of the browser after the page that calls it, as "name | app", while the page is on
 * show; the title goes back to the name of the app when the page leaves or is kept hidden. Any page
 * can name itself: give it the name that the page shows, or null while that name is not known.
 *
 * The router writes the title of the route into the tab after it has drawn a page it went to, which
 * would take the name of the page away, so the title is set again whenever something else changes it.
 */
export function usePageTitle(name: string | null | undefined): void {
  useEffect(() => {
    const wanted = pageTitle(name)
    const claim = () => {
      if (document.title !== wanted) document.title = wanted
    }
    claim()
    const observer = new MutationObserver(claim)
    observer.observe(document.head, { childList: true, subtree: true, characterData: true })
    return () => {
      observer.disconnect()
      document.title = pageTitle(null)
    }
  }, [name])
}
