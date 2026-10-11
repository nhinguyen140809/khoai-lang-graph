import type { ContentSchema, SchemaProperty } from './artifacts.types'

export const widgets = [
  'text',
  'textarea',
  'select',
  'number',
  'list',
  'tags',
  'object-list',
] as const

export type Widget = (typeof widgets)[number]

/** A field as the detail view and the edit form see it, built from one property of a schema. */
export interface FieldView {
  name: string
  /** Derived from the name: `acceptance_criteria` reads "Acceptance criteria". */
  label: string
  widget: Widget
  /** The type list of the property contains `null`. */
  nullable: boolean
  required: boolean
  readOnly: boolean
  /** The values of a select, without `null`; empty for the other widgets. */
  options: string[]
  description: string | null
  /** The artifact and field that a select takes its values from, such as `elicitation_plan.topics`. */
  valueFrom: string | null
  minimum: number | null
  maximum: number | null
  /** The fields of one entry of an `object-list`. */
  entryFields: FieldView[]
}

function isWidget(value: string | undefined): value is Widget {
  return widgets.some((widget) => widget === value)
}

function typesOf(property: SchemaProperty): string[] {
  if (property.type === undefined) return []
  return Array.isArray(property.type) ? property.type : [property.type]
}

/** The widget of a property: the one it names, else one that fits its type. */
function widgetOf(property: SchemaProperty): Widget {
  const named = property['x-ui-widget']
  if (isWidget(named)) return named
  const types = typesOf(property).filter((type) => type !== 'null')
  if (property.enum !== undefined) return 'select'
  if (types.includes('integer') || types.includes('number')) return 'number'
  if (types.includes('array')) return 'list'
  return 'text'
}

/** `acceptance_criteria` as "Acceptance criteria". */
export function fieldLabel(name: string): string {
  const words = name.replaceAll('_', ' ')
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`
}

function viewOf(name: string, property: SchemaProperty, required: boolean): FieldView {
  const widget = widgetOf(property)
  const properties = property.items?.properties
  const entryRequired = property.items?.required
  const entryProperties =
    typeof properties === 'object' && properties !== null
      ? (properties as Record<string, SchemaProperty>)
      : {}
  const requiredNames = Array.isArray(entryRequired) ? (entryRequired as string[]) : []
  return {
    name,
    label: fieldLabel(name),
    widget,
    nullable: typesOf(property).includes('null') || property.enum?.includes(null) === true,
    required,
    readOnly: property.readOnly === true,
    options: (property.enum ?? []).filter((value): value is string => typeof value === 'string'),
    description: property.description ?? null,
    valueFrom: property['x-value-from'] ?? null,
    minimum: property.minimum ?? null,
    maximum: property.maximum ?? null,
    entryFields:
      widget === 'object-list'
        ? Object.entries(entryProperties).map(([entryName, entry]) =>
            viewOf(entryName, entry, requiredNames.includes(entryName)),
          )
        : [],
  }
}

/** The fields of a content schema in the order of `x-ui-field-order`, then any others. */
export function fieldViews(schema: ContentSchema): FieldView[] {
  const properties = schema.properties ?? {}
  const required = schema.required ?? []
  const ordered = schema['x-ui-field-order'] ?? []
  const names = [
    ...ordered.filter((name) => name in properties),
    ...Object.keys(properties).filter((name) => !ordered.includes(name)),
  ]
  return names.map((name) => viewOf(name, properties[name] ?? {}, required.includes(name)))
}

/** The fields that a table or a card of an item kind shows, in the order of `x-ui-list-fields`. */
export function listFieldViews(schema: ContentSchema): FieldView[] {
  const views = fieldViews(schema)
  const names = schema['x-ui-list-fields'] ?? []
  if (names.length === 0) return views.slice(0, 3)
  return names.flatMap((name) => views.filter((view) => view.name === name))
}

/** The name of the field that titles an item of this kind, if the schema names one. */
export function titleField(schema: ContentSchema): string | null {
  return schema['x-ui-title-field'] ?? null
}

/** What an item is called: its title field, else its key. */
export function itemTitle(
  schema: ContentSchema | undefined,
  item: { key: string; content: Record<string, unknown> },
): string {
  const field = schema === undefined ? null : titleField(schema)
  const value = field === null ? undefined : item.content[field]
  return typeof value === 'string' && value !== '' ? value : item.key
}

/** The value a field starts with when the item has none. */
export function emptyValue(view: FieldView): unknown {
  switch (view.widget) {
    case 'list':
    case 'tags':
    case 'object-list':
      return []
    case 'number':
      return view.nullable ? null : ''
    case 'select':
      return view.nullable ? null : ''
    default:
      return view.nullable ? null : ''
  }
}

/** A value of a field as plain text, for a table cell or a summary. */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    return value
      .map((entry) =>
        typeof entry === 'object' && entry !== null
          ? Object.values(entry as Record<string, unknown>)
              .map(formatValue)
              .join(' / ')
          : formatValue(entry),
      )
      .join('; ')
  }
  return JSON.stringify(value)
}

function isEmpty(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  )
}

/** The problem with a value, in the words of a form, or null when the value is fine. */
function problemWith(view: FieldView, value: unknown): string | null {
  // An empty list is a value; only a missing or blank value is not.
  if (view.required && !view.nullable && (value === null || value === undefined || value === '')) {
    return 'Enter a value.'
  }
  if (isEmpty(value)) return null
  if (view.widget === 'number') {
    const number = typeof value === 'number' ? value : Number(value)
    if (Number.isNaN(number)) return 'Enter a number.'
    if (view.minimum !== null && number < view.minimum)
      return `Enter ${String(view.minimum)} or more.`
    if (view.maximum !== null && number > view.maximum)
      return `Enter ${String(view.maximum)} or less.`
  }
  if (
    view.widget === 'select' &&
    view.options.length > 0 &&
    !view.options.includes(String(value))
  ) {
    return 'Choose one of the values.'
  }
  if (view.widget === 'object-list' && Array.isArray(value)) {
    for (const entry of value) {
      const record = (typeof entry === 'object' && entry !== null ? entry : {}) as Record<
        string,
        unknown
      >
      for (const field of view.entryFields) {
        if (field.required && isEmpty(record[field.name]))
          return `Fill in "${field.label}" in every entry.`
      }
    }
  }
  return null
}

/** The problems of a content against the fields of its schema, by field name. */
export function validateContent(
  views: FieldView[],
  content: Record<string, unknown>,
): Record<string, string> {
  const problems: Record<string, string> = {}
  for (const view of views) {
    if (view.readOnly) continue
    const problem = problemWith(view, content[view.name])
    if (problem !== null) problems[view.name] = problem
  }
  return problems
}

/** The content as the API stores it: numbers as numbers, an empty nullable field as null. */
export function toStoredContent(
  views: FieldView[],
  content: Record<string, unknown>,
): Record<string, unknown> {
  const readOnly = new Set(views.filter((view) => view.readOnly).map(({ name }) => name))
  const stored: Record<string, unknown> = Object.fromEntries(
    Object.entries(content).filter(([name]) => !readOnly.has(name)),
  )
  for (const view of views) {
    if (view.readOnly) continue
    const value = content[view.name]
    if (view.widget === 'number' && !isEmpty(value)) stored[view.name] = Number(value)
    else if (view.nullable && isEmpty(value) && view.widget !== 'list' && view.widget !== 'tags') {
      stored[view.name] = null
    }
  }
  return stored
}

/** The names of the fields whose value differs between two contents. */
export function changedFields(
  views: FieldView[],
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string[] {
  return views
    .filter(
      (view) =>
        JSON.stringify(before[view.name] ?? null) !== JSON.stringify(after[view.name] ?? null),
    )
    .map((view) => view.name)
}
