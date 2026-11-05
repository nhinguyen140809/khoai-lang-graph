import { type ArtifactItem, useItemSchema } from '@/modules/artifact/entities'
import { itemTabIconName } from '@/modules/documents/entities'
import { contentDisplayOf } from '@/modules/workflow/entities'
import { useEditorTab } from '@/shared/components/frame'
import { routes } from '@/shared/routes'

import { itemPageMessages } from '../item-page.constants'
import { itemTabTitle } from '../item-tab.utils'

/**
 * Opens the tab of the page of an item, titled with the item and with the icon of the display of
 * its kind. The tab is there while the item loads or fails, with a stand-in title, and does not
 * wait for the item. Returns what keeps the tab: the first change of the page calls it, so that
 * the tab stays after an edit.
 */
export function useItemTab(projectId: string, itemId: string, record: ArtifactItem | undefined) {
  const { schema } = useItemSchema(record)
  const title = itemTabTitle(record, schema)
  return useEditorTab(
    {
      id: `item:${itemId}`,
      title: title ?? itemPageMessages.tabTitle,
      href: routes.project(projectId).item(itemId),
      icon: itemTabIconName(schema === undefined ? undefined : contentDisplayOf(schema)),
    },
    { isTitleProvisional: title === null },
  )
}
