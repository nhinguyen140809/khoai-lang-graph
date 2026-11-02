import type { ArtifactItem } from '@/modules/artifact/entities'
import { type ContentSchema, itemTitle } from '@/modules/workflow/entities'

/**
 * The title of the tab of an item page, or null while it is not known: the title of an item comes
 * from its schema, so an item whose schema has not loaded would read as its key.
 */
export function itemTabTitle(
  record: ArtifactItem | undefined,
  schema: ContentSchema | undefined,
): string | null {
  return record === undefined || schema === undefined ? null : itemTitle(schema, record)
}
