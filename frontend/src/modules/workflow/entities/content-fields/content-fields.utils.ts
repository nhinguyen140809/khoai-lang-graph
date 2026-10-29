import { snakeToSentenceCase } from '@/shared/lib/formatters'
import { hasText, isOneOf, isString } from '@/shared/lib/guards'

import type { ContentSchema, SchemaProperty } from '../artifact-kinds/artifact-kinds.types'
import {
  type ContentDisplay,
  contentDisplays,
  type ContentField,
  type FieldWidget,
  fieldWidgets,
} from './content-fields.types'
import type { ContentValues } from './content-values.types'

// The fields of a content, read from the JSON schema of its kind: the widget, label, limits and
// options of each field, in the order the schema asks for, and how a kind is shown (its display, the
// fields of its table, the title of its items). The values of those fields are handled in
// `content-values.utils.ts`.

function typesOf(property: SchemaProperty): string[] {
  if (property.type === undefined) return []
  return Array.isArray(property.type) ? property.type : [property.type]
}

/** The widget of a property: the one it names, else one that fits its type. */
function fieldWidgetOf(property: SchemaProperty): FieldWidget {
  const named = property['x-ui-widget']
  if (isOneOf(fieldWidgets, named)) return named
  const types = typesOf(property).filter((type) => type !== 'null')
  if (property.enum !== undefined) return 'select'
  if (types.includes('integer') || types.includes('number')) return 'number'
  if (types.includes('array')) return 'list'
  if (types.includes('boolean')) return 'boolean'
  return 'text'
}

function fieldOf(name: string, property: SchemaProperty, isRequired: boolean): ContentField {
  const widget = fieldWidgetOf(property)
  const entryProperties = property.items?.properties ?? {}
  const requiredNames = property.items?.required ?? []
  return {
    name,
    label: property.title ?? snakeToSentenceCase(name),
    widget,
    nullable: typesOf(property).includes('null') || property.enum?.includes(null) === true,
    required: isRequired,
    readOnly: property.readOnly === true,
    options: (property.enum ?? []).filter(isString),
    description: property.description ?? null,
    allowedValuesFrom: property['x-value-from'] ?? null,
    minItems: property.minItems ?? null,
    minimum: property.minimum ?? null,
    maximum: property.maximum ?? null,
    integer: typesOf(property).includes('integer'),
    defaultValue: property.default ?? null,
    entryFields:
      widget === 'object-list'
        ? Object.entries(entryProperties).map(([entryName, entry]) =>
            fieldOf(entryName, entry, requiredNames.includes(entryName)),
          )
        : [],
  }
}

/** How a kind is shown: the display it names, else `document` for an artifact and `table` for an item. */
export function contentDisplayOf(schema: ContentSchema): ContentDisplay {
  const named = schema['x-ui-display']
  if (isOneOf(contentDisplays, named)) return named
  return schema['x-level'] === 'artifact' ? 'document' : 'table'
}

/** The fields of a content schema in the order of `x-ui-field-order`, then any others. */
export function contentFields(schema: ContentSchema): ContentField[] {
  const properties = schema.properties ?? {}
  const required = schema.required ?? []
  const ordered = schema['x-ui-field-order'] ?? []
  const names = [
    ...ordered.filter((name) => name in properties),
    ...Object.keys(properties).filter((name) => !ordered.includes(name)),
  ]
  return names.map((name) => fieldOf(name, properties[name] ?? {}, required.includes(name)))
}

/** The fields that a table or a card of an item kind shows, in the order of `x-ui-list-fields`. */
export function summaryFields(schema: ContentSchema): ContentField[] {
  const fields = contentFields(schema)
  const names = schema['x-ui-list-fields'] ?? []
  if (names.length === 0) return fields.slice(0, 3)
  return names.flatMap((name) => fields.filter((field) => field.name === name))
}

/** What an item is called: its title field, else its key. */
export function itemTitle(
  schema: ContentSchema | undefined,
  item: { key: string; content: ContentValues },
): string {
  const titleName = schema?.['x-ui-title-field']
  const value = titleName === undefined ? undefined : item.content[titleName]
  return isString(value) && hasText(value) ? value : item.key
}
