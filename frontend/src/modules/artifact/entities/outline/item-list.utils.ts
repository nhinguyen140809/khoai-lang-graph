import {
  type ContentField,
  type ContentSchema,
  extensionFieldText,
  fieldText,
  itemTitle,
} from '@/modules/workflow/entities/@x/artifact'
import { collapseSpaces } from '@/shared/lib/text'

import type { OutlineItem } from '../items/items.types'
import type { ItemGroup, KindView } from './outline.types'

/**
 * The items of a run in groups by the text of the field that `x-ui-group-by` names, the groups in
 * the order their values first appear; a value that differs only in case or spacing is the group
 * of the first written, and the items with no text there share a group of their own.
 */
export function groupItemsBy(items: readonly OutlineItem[], schema: ContentSchema): ItemGroup[] {
  const groups = new Map<string, ItemGroup>()
  for (const item of items) {
    const value = collapseSpaces(extensionFieldText(schema, item, 'x-ui-group-by'))
    const key = value.toLowerCase()
    const group = groups.get(key)
    if (group === undefined) groups.set(key, { value, items: [item] })
    else group.items.push(item)
  }
  return [...groups.values()]
}

/** What a field of an item calls the item in a list: the text of the field when it has some, else the title of the item. */
export function itemTitleOf(view: KindView, item: OutlineItem, field: ContentField): string {
  return fieldText(item, field.name) ?? itemTitle(view.schema, item)
}
