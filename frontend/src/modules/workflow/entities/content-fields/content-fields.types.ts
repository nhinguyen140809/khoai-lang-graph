// A widget and a display both come from the schema, but at different levels. A widget is for one
// field: the control of the edit form that shows and changes its value, named by `x-ui-widget` on
// a property. A display is for a whole kind: how its content is laid out on the screen, named by
// `x-ui-display` on the schema of the kind, such as a table of items or a list of cards.

/** The control for one field, such as a text input, a select or a list of tags. */
export const fieldWidgets = [
  'text',
  'textarea',
  'select',
  'number',
  'boolean',
  'list',
  'tags',
  'object-list',
] as const

export type FieldWidget = (typeof fieldWidgets)[number]

/** The ways to lay out the content of a kind. */
export const contentDisplays = ['document', 'heading', 'table', 'cards', 'transcript'] as const

/** How the content of a kind is laid out; an artifact is a `document`, its items take the others. */
export type ContentDisplay = (typeof contentDisplays)[number]

/**
 * One field of the content of an artifact or an item, built from one property of the schema of its
 * kind: what a screen needs to show and check the field, not its value.
 */
export interface ContentField {
  name: string
  /** The title of the property; when it has none, derived from the name: `acceptance_criteria` reads "Acceptance criteria". */
  label: string
  widget: FieldWidget
  /** The type list of the property contains `null`. */
  nullable: boolean
  required: boolean
  readOnly: boolean
  /** The values of a select, without `null`; empty for the other widgets. */
  options: string[]
  description: string | null
  /** The artifact and field whose entries a select may take (`x-value-from`), such as `elicitation_plan.topics`. */
  allowedValuesFrom: string | null
  /** The fewest entries of a list; null when it may be empty. */
  minItems: number | null
  minimum: number | null
  maximum: number | null
  /** The type list of the property contains `integer`: a number with no fraction. */
  integer: boolean
  /** The `default` of the property; null without one. */
  defaultValue: unknown
  /** The fields of one entry of an `object-list`. */
  entryFields: ContentField[]
}
