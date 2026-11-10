import { isOneOf, isString } from '@/shared/lib/guards'
import { snakeToSentenceCase } from '@/shared/lib/text'

import type {
  ArtifactKinds,
  ContentSchema,
  SchemaProperty,
} from '../../artifact-kinds/artifact-kinds.types'
import {
  type ArtifactDisplay,
  artifactDisplays,
  type ContentDisplay,
  type ContentField,
  type FieldWidget,
  fieldWidgets,
  hasObjectEntries,
  type ItemDisplay,
  itemDisplays,
  type ItemPageLayout,
  itemPageLayouts,
  oneLineWidgets,
  type ProfileFields,
  type RatingFields,
} from './content-fields.types'

// The fields of a content, read from the JSON schema of its kind: the widget, title, limits and
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
    min: scale?.minimum ?? 1,
    max: scale?.maximum ?? 5,
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
    options: (property.enum ?? []).filter(isString),
    description: property.description ?? null,
    allowedValuesFrom: property['x-value-from'] ?? null,
    valueList: property['x-value-list'] ?? null,
    minItems: property.minItems ?? null,
    minimum: property.minimum ?? null,
    maximum: property.maximum ?? null,
    integer: typesOf(property).includes('integer'),
    defaultValue: property.default ?? null,
    entryFields: hasObjectEntries(widget)
      ? Object.entries(entryProperties).map(([entryName, entry]) =>
          fieldOf(`${path}.${entryName}`, entryName, entry, requiredNames.includes(entryName)),
        )
      : [],
    rating: widget === 'rating-list' ? ratingFieldsOf(property) : null,
  }
}

/** The layout that an artifact kind names for its document, else `document`. */
export function artifactDisplayOf(schema: ContentSchema): ArtifactDisplay {
  const named = schema['x-ui-display']
  return isOneOf(artifactDisplays, named) ? named : 'document'
}

/** The display an item kind names, else `table`. */
function itemDisplayOf(schema: ContentSchema): ItemDisplay {
  const named = schema['x-ui-display']
  return isOneOf(itemDisplays, named) ? named : 'table'
}

/** How a kind is shown: for an artifact, its layout; for an item, the display it names, else `table`. */
export function contentDisplayOf(schema: ContentSchema): ContentDisplay {
  return schema['x-level'] === 'artifact' ? artifactDisplayOf(schema) : itemDisplayOf(schema)
}

/** The layout of the page of one item of the kind: the row of its display in `itemPageLayouts`. */
export function pageLayoutOf(schema: ContentSchema): ItemPageLayout {
  return itemPageLayouts[itemDisplayOf(schema)]
}

/**
 * What each kind of artifact is made of, by kind name: the layout of its own schema when it names
 * one, else the display of the first kind of item that holds content, since a section only gives
 * the structure; `heading` for a kind that holds sections alone, and `document` for a kind that
 * holds no item.
 */
export function documentDisplaysByKind(
  kinds: ArtifactKinds | undefined,
): Map<string, ContentDisplay> {
  return new Map(
    (kinds?.artifact_kinds ?? []).map(({ kind, schema, item_kinds }): [string, ContentDisplay] => {
      const layout = artifactDisplayOf(schema)
      if (layout !== 'document') return [kind, layout]
      const displays = item_kinds.map(({ schema: itemSchema }) => contentDisplayOf(itemSchema))
      const content = displays.find((display) => display !== 'heading')
      return [kind, content ?? displays[0] ?? 'document']
    }),
  )
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

/** The first field of the schema that is not its title field: what an item says, such as the statement of a requirement. */
export function mainField(schema: ContentSchema): ContentField | undefined {
  const title = schema['x-ui-title-field']
  return contentFields(schema).find((field) => field.name !== title)
}

/** The fields that a table or a card of an item kind shows, in the order of `x-ui-list-fields`. */
export function summaryFields(schema: ContentSchema): ContentField[] {
  const fields = contentFields(schema)
  const names = schema['x-ui-list-fields'] ?? []
  if (names.length === 0) return fields.slice(0, 3)
  return names.flatMap((name) => fields.filter((field) => field.name === name))
}

/**
 * Whether the items of a kind can be reached one by one, with a row in the outline of a document
 * and a page of their own. A kind without the keyword can; the items that cannot are short enough
 * to read in place in the page of the document.
 */
export function isNavigable(schema: ContentSchema): boolean {
  return schema['x-ui-navigable'] !== false
}

/** The field that an extension of the schema names; undefined when there is none. */
export function extensionField(
  schema: ContentSchema,
  extension: 'x-ui-title-field' | 'x-ui-role-field' | 'x-ui-participants-field',
): ContentField | undefined {
  const name = schema[extension]
  return name === undefined ? undefined : contentFields(schema).find((field) => field.name === name)
}

/** Whether a field offers values to choose from: an enum, a value list or the values of another artifact. */
export function isChoiceField(
  field: Pick<ContentField, 'options' | 'valueList' | 'allowedValuesFrom'>,
): boolean {
  return field.options.length > 0 || field.valueList !== null || field.allowedValuesFrom !== null
}

/** Whether the value of a field is a number, whatever its widget: the schema made it an integer or bounded it. */
export function isNumberField(
  field: Pick<ContentField, 'integer' | 'minimum' | 'maximum'>,
): boolean {
  return field.integer || field.minimum !== null || field.maximum !== null
}

/** Whether the value of a field reads on one line: its widget is one of `oneLineWidgets`. */
export function isOneLineField(field: Pick<ContentField, 'widget'>): boolean {
  return isOneOf(oneLineWidgets, field.widget)
}

/** Whether a field marks a place of a sequence: its widget is `separator`. */
export function isSeparatorField(field: Pick<ContentField, 'widget'>): boolean {
  return field.widget === 'separator'
}

/** The fields of a kind whose display is `profile`, as its cards and the page of one item draw them. */
export function profileFields(schema: ContentSchema): ProfileFields {
  const titleName = schema['x-ui-title-field']
  const fields = contentFields(schema)
  const listed = summaryFields(schema)
  const line = listed.filter((field) => field.name !== titleName && isOneLineField(field))
  const lineNames = new Set(line.map(({ name }) => name))
  return {
    title: titleName === undefined ? undefined : fields.find((field) => field.name === titleName),
    line,
    card: listed.filter((field) => field.name !== titleName && !lineNames.has(field.name)),
    body: fields.filter((field) => field.name !== titleName && !lineNames.has(field.name)),
  }
}
