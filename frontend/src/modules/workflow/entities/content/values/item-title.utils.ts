import { hasText, isString } from '@/shared/lib/guards'

import type { ContentSchema } from '../../artifact-kinds/artifact-kinds.types'
import type { ContentValues } from './content-values.types'

/** What an item is called: its title field, else its key. */
export function itemTitle(
  schema: ContentSchema | undefined,
  item: { key: string; content: ContentValues },
): string {
  const titleName = schema?.['x-ui-title-field']
  return (titleName === undefined ? null : fieldText(item, titleName)) ?? item.key
}

/** The text of a field of an item when it holds some, else null. */
export function fieldText(item: { content: ContentValues }, name: string): string | null {
  const value = item.content[name]
  return isString(value) && hasText(value) ? value : null
}

/**
 * The text of the field that an extension of the schema names, such as the words of a message of
 * a transcript, or who says them; empty when the schema or the field holds none.
 */
export function extensionFieldText(
  schema: ContentSchema | undefined,
  item: { content: ContentValues },
  extension: 'x-ui-title-field' | 'x-ui-role-field',
): string {
  const name = schema?.[extension]
  return name === undefined ? '' : (fieldText(item, name) ?? '')
}
