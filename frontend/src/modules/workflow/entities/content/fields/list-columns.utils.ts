import type { ContentSchema } from '../../artifact-kinds/artifact-kinds.types'
import { type ContentField, type ListColumn } from './content-fields.types'
import { contentFields } from './content-fields.utils'

/** The fields that a table or a card of an item kind shows, in the order of `x-ui-list-fields`. */
export function summaryFields(schema: ContentSchema): ContentField[] {
  const fields = contentFields(schema)
  const names = schema['x-ui-list-fields'] ?? []
  if (names.length === 0) return fields.slice(0, 3)
  return names.flatMap((name) => fields.filter((field) => field.name === name))
}

/** The name that `x-ui-list-fields` gives to the key of an item (`REQ-001`), which is no property. */
export const itemKeyColumn = 'key'

/**
 * The columns of a table of items, in the order of `x-ui-list-fields`. The key of an item is a
 * column only where the list names it, and the schema puts it where it belongs, last. A kind with
 * no list shows its first fields and no key.
 */
export function listColumns(schema: ContentSchema): ListColumn[] {
  const fields = contentFields(schema)
  const names = schema['x-ui-list-fields'] ?? []
  if (names.length === 0) return fields.slice(0, 3).map((field) => ({ type: 'field', field }))
  return names.flatMap((name): ListColumn[] =>
    name === itemKeyColumn
      ? [{ type: 'key' }]
      : fields.filter((field) => field.name === name).map((field) => ({ type: 'field', field })),
  )
}
