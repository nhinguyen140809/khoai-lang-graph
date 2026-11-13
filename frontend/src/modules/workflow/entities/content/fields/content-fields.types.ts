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
  'separator',
  'avatar-list',
  'badge',
  'rating-list',
] as const

export type FieldWidget = (typeof fieldWidgets)[number]

/** The widgets whose value reads on one line, such as under the title of an avatar card. */
export const oneLineWidgets = [
  'text',
  'select',
  'badge',
  'number',
  'boolean',
  'separator',
] as const satisfies readonly FieldWidget[]

/** The ways to lay out the content of a kind. */
export const contentDisplays = [
  'document',
  'heading',
  'table',
  'cards',
  'transcript',
  'profile',
] as const

/** How the content of a kind is laid out; an artifact takes a layout of its document, its items the others. */
export type ContentDisplay = (typeof contentDisplays)[number]

/** The layouts of a whole document, which an artifact kind may name; its items take the others. */
export const artifactDisplays = [
  'document',
  'transcript',
] as const satisfies readonly ContentDisplay[]

export type ArtifactDisplay = (typeof artifactDisplays)[number]

/** The displays of an item kind: how a run of its items is drawn in a document. */
export const itemDisplays = [
  'heading',
  'table',
  'cards',
  'transcript',
  'profile',
] as const satisfies readonly ContentDisplay[]

export type ItemDisplay = (typeof itemDisplays)[number]

/** How the page of one item is laid out: every field under its label, or the whole page as a profile. */
export type ItemPageLayout = 'fields' | 'profile'

/** The layout of the page of one item, by the display of its kind; a display without a row fails to compile. */
export const itemPageLayouts = {
  heading: 'fields',
  table: 'fields',
  cards: 'fields',
  transcript: 'fields',
  profile: 'profile',
} as const satisfies Record<ItemDisplay, ItemPageLayout>

/**
 * One field of the content of an artifact or an item, built from one property of the schema of its
 * kind: what a screen needs to show and check the field, not its value.
 */
export interface ContentField {
  name: string
  /** The kind and the name, such as `interview_transcript.stop_reason`; an entry of a list adds its name after its list. */
  path: string
  /** The title of the property; when it has none, derived from the name: `acceptance_criteria` reads "Acceptance criteria". */
  title: string
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
  /** The key of the value list whose titles name the values of the field (`x-value-list`); null when it names none. */
  valueList: string | null
  /** The fewest entries of a list; null when it may be empty. */
  minItems: number | null
  minimum: number | null
  maximum: number | null
  /** The type list of the property contains `integer`: a number with no fraction. */
  integer: boolean
  /** The `default` of the property; null without one. */
  defaultValue: unknown
  /** The fields of one entry of an `object-list` or a `rating-list`. */
  entryFields: ContentField[]
  /** How the entries of a `rating-list` are read; null for the other widgets, and for a rating list whose schema names no label or value field. */
  rating: RatingFields | null
}

/** Which fields of an entry of a `rating-list` name what is rated, hold the rating and say why, and the scale of the rating. */
export interface RatingFields {
  label: string
  value: string
  /** The field that says why; null when the schema names none. */
  note: string | null
  min: number
  max: number
}

/** Whether the entries of the widget are objects with fields of their own. */
export function hasObjectEntries(widget: FieldWidget): boolean {
  return widget === 'object-list' || widget === 'rating-list'
}

/** The fields of a kind whose display is `profile`, as its cards and the page of one item draw them. */
export interface ProfileFields {
  /** The field of `x-ui-title-field`: the name on the card and the heading of the page. */
  title: ContentField | undefined
  /** The other list fields that read on one line: under the name on the card, on the key line of the page. */
  line: ContentField[]
  /** The other list fields: a text on two lines and a list on one line, on the card. */
  card: ContentField[]
  /** Every field but the title and the line, in field order: the body of the page. */
  body: ContentField[]
}
