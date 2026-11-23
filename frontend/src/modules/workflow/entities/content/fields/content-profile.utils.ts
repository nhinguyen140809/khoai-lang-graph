import type { ContentSchema } from '../../artifact-kinds/artifact-kinds.types'
import { type ContentField, type ContentSection, type ProfileFields } from './content-fields.types'
import { shownFields } from './content-fields.utils'
import { isOneLineField } from './field-widget.utils'
import { summaryFields } from './list-columns.utils'

/** The fields of a kind whose display is `profile`, as its cards and the page of one item draw them. */
export function profileFields(schema: ContentSchema): ProfileFields {
  const titleName = schema['x-ui-title-field']
  const fields = shownFields(schema)
  const listed = summaryFields(schema)
  const line = listed.filter((field) => field.name !== titleName && isOneLineField(field))
  const lineNames = new Set(line.map(({ name }) => name))
  const body = fields.filter((field) => field.name !== titleName && !lineNames.has(field.name))
  return {
    title: titleName === undefined ? undefined : fields.find((field) => field.name === titleName),
    line,
    card: listed.filter((field) => field.name !== titleName && !lineNames.has(field.name)),
    body,
    sections: sectionsOf(schema, body),
  }
}

/**
 * The blocks of the page of an item from `x-ui-sections`: each block holds the fields it names
 * that the body has, in its order, and a block left with none is dropped. The fields of the body
 * that no block names come last in a block with no title. A schema with no blocks has none.
 */
export function sectionsOf(schema: ContentSchema, body: readonly ContentField[]): ContentSection[] {
  const named = schema['x-ui-sections'] ?? []
  if (named.length === 0) return []
  const used = new Set(named.flatMap(({ fields }) => fields))
  const blocks = named.map(({ title, fields }): ContentSection => ({
    title,
    fields: fields.flatMap((name) => body.find((field) => field.name === name) ?? []),
  }))
  const rest = body.filter((field) => !used.has(field.name))
  return [...blocks, { title: null, fields: rest }].filter(({ fields }) => fields.length > 0)
}
