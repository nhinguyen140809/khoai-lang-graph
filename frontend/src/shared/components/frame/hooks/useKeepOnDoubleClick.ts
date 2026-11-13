'use client'

import { useEffect } from 'react'

import { useEditorTabsStore } from '../tabs/editor-tabs.store'
import { noteClick, pageOpenedByDoubleClick } from '../tabs/last-page-open.utils'

/**
 * Keeps the tab of the page that a click has just opened when the click is followed by a second
 * one at the same place, wherever the second one lands. A page that opens in the place of what
 * was clicked, such as one opened from a card over another page, takes that element away, so a
 * double click on the element would never arrive; this reads it from the pointer instead.
 */
export function useKeepOnDoubleClick() {
  const keepPage = useEditorTabsStore((state) => state.keepPage)

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      noteClick(event)
    }
    const onDoubleClick = (event: MouseEvent) => {
      const href = pageOpenedByDoubleClick(event)
      if (href !== null) keepPage(href)
    }
    // The first listener runs before the click is handled, so the place is known when a page opens.
    document.addEventListener('click', onClick, true)
    document.addEventListener('dblclick', onDoubleClick)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('dblclick', onDoubleClick)
    }
  }, [keepPage])
}
