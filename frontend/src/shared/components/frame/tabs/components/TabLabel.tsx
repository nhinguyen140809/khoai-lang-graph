import { FileIcon } from 'lucide-react'

import { destinationOfHref } from '../../destinations/destination.utils'
import { useDestinations } from '../../destinations/hooks/useDestinations'
import type { EditorTab } from '../editor-tabs.types'
import { useTabIcon } from '../hooks/useTabIcon'

interface TabLabelProps {
  tab: EditorTab
  /** The preview tab of the group, which the next page opened replaces. */
  preview: boolean
}

/**
 * The icon and the title of a tab, on the tab and in the list of open tabs. The icon is the one
 * that the page of the tab names among the registered tab icons, else the icon of the feature it
 * belongs to. Inside an element of the group `tab`, `data-active` colors the icon and
 * `data-preview` sets the title in italics.
 */
export function TabLabel({ tab, preview }: TabLabelProps) {
  const { destinations } = useDestinations()
  const named = useTabIcon(tab.icon)
  const icon = named ?? destinationOfHref(destinations, tab.href)?.icon ?? <FileIcon />

  return (
    <>
      <span
        aria-hidden
        className="flex shrink-0 group-data-[active=true]/tab:text-primary [&_svg]:size-4"
      >
        {icon}
      </span>
      {/* The padding on the right keeps the slant of the last letter of an italic title inside the
          box that the truncation clips, so it is not cut. */}
      <span className="truncate pr-1 group-data-[preview=true]/tab:italic">{tab.title}</span>
      {preview && <span className="sr-only">, preview</span>}
    </>
  )
}
