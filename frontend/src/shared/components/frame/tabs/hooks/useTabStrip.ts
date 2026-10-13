import { useContext } from 'react'

import { type TabStrip, TabStripContext } from '../TabStripContext'

/** The tab strip that the calling tab or menu belongs to, inside `EditorTabs`. */
export function useTabStrip(): TabStrip {
  const strip = useContext(TabStripContext)
  if (strip === null) throw new Error('useTabStrip is called outside EditorTabs.')
  return strip
}
