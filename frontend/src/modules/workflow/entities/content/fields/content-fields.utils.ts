import { isOneOf, isString } from '@/shared/lib/guards'
import { snakeToSentenceCase } from '@/shared/lib/text'

import type { ContentSchema, SchemaProperty } from '../../artifact-kinds/artifact-kinds.types'
import {
  type ContentField,
  type FieldExtension,
  type FieldWidget,
  fieldWidgets,
  hasObjectEntries,
  type RatingFields,
} from './content-fields.types'

// The fields of a content, read from the JSON schema of its kind: the widget, title, limits and
// options of each field, in the order the schema asks for. How a kind is shown, the columns of its
// table and the profile of its items are read in the files beside this one; the values of the
// fields are handled in `content-values.utils.ts`.

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

/** How the entries of a rating list are read, from the keywords of its property; null without a label field and a value field. */
function ratingFieldsOf(property: SchemaProperty): RatingFields | null {
  const label = property['x-ui-label-field']
  const value = property['x-ui-value-field']
  if (label === undefined || value === undefined) return null
  const scale = property.items?.properties?.[value]
  return {
    label,
    value,
    note: property['x-ui-note-field'] ?? null,
    group: property['x-ui-group-field'] ?? null,
    min: scale?.minimum ?? 1,
    max: scale?.maximum ?? 5,
  }
}

/** What describes a field, and where its values come from. */
function sourcesOf(property: SchemaProperty) {
  return {
    description: property.description ?? null,
    allowedValuesFrom: property['x-value-from'] ?? null,
    valueList: property['x-value-list'] ?? null,
  }
}

/** The bounds of a field and the value it starts with. */
function limitsOf(property: SchemaProperty) {
  return {
    minItems: property.minItems ?? null,
    minimum: property.minimum ?? null,
    maximum: property.maximum ?? null,
    defaultValue: property.default ?? null,
  }
}

function fieldOf(
  path: string,
  name: string,
  property: SchemaProperty,
  isRequired: boolean,
): ContentField {
  const widget = fieldWidgetOf(property)
  const entryProperties = property.items?.properties ?? {}
  const requiredNames = property.items?.required ?? []
  return {
    name,
    path,
    title: property.title ?? snakeToSentenceCase(name),
    widget,
    nullable: typesOf(property).includes('null') || property.enum?.includes(null) === true,
    required: isRequired,
    readOnly: property.readOnly === true,
    isHidden: property['x-ui-hidden'] === true,
    options: (property.enum ?? []).filter(isString),
    ...sourcesOf(property),
    ...limitsOf(property),
    integer: typesOf(property).includes('integer'),
    entryFields: hasObjectEntries(widget)
      ? Object.entries(entryProperties).map(([entryName, entry]) =>
          fieldOf(`${path}.${entryName}`, entryName, entry, requiredNames.includes(entryName)),
        )
      : [],
    rating: widget === 'rating-list' ? ratingFieldsOf(property) : null,
  }
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
  const kind = schema['x-kind'] ?? ''
  return names.map((name) =>
    fieldOf(`${kind}.${name}`, name, properties[name] ?? {}, required.includes(name)),
  )
}

/** The fields of the schema that a page shows: every field but those that `x-ui-hidden` leaves out. */
export function shownFields(schema: ContentSchema): ContentField[] {
  return contentFields(schema).filter((field) => !field.isHidden)
}

/** The first field of the schema that is not its title field: what an item says, such as the statement of a requirement. */
export function mainField(schema: ContentSchema): ContentField | undefined {
  const title = schema['x-ui-title-field']
  return contentFields(schema).find((field) => field.name !== title)
}

/** The field that an extension of the schema names; undefined when there is none. */
export function extensionField(
  schema: ContentSchema,
  extension: FieldExtension,
): ContentField | undefined {
  const name = schema[extension]
  return name === undefined ? undefined : contentFields(schema).find((field) => field.name === name)
}
