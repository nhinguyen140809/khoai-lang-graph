import { FileIcon } from 'lucide-react'

import { useActivities } from '../activities/ActivitiesContext'
import { activityOfHref } from '../activities/activity.utils'
import type { EditorTab } from './editor-tabs.store'

interface TabLabelProps {
  tab: EditorTab
  /** The preview tab of the group, which the next page opened replaces. */
  preview: boolean
}

/**
 * The icon and the title of a tab, on the tab and in the list of open tabs. The icon is the one
 * that the page of the tab names among the tab icons of the frame, else the icon of the feature it
 * belongs to. Inside an element of the group `tab`, `data-active` colors the icon and
 * `data-preview` sets the title in italics.
 */
export function TabLabel({ tab, preview }: TabLabelProps) {
  const { activities, tabIcons } = useActivities()
  const named = tab.icon === undefined ? undefined : tabIcons[tab.icon]
  const icon = named ?? activityOfHref(activities, tab.href)?.icon ?? <FileIcon />

  return (
    <>
      <span
        aria-hidden
        className="flex shrink-0 group-data-[active=true]/tab:text-primary [&_svg]:size-4"
      >
        {icon}
      </span>
      <span className="truncate group-data-[preview=true]/tab:italic">{tab.title}</span>
      {preview && <span className="sr-only">, preview</span>}
    </>
  )
}
