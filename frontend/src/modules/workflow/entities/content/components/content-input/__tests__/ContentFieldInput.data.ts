import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'

import type { ContentField } from '../../../fields/content-fields.types'
import { contentFields } from '../../../fields/content-fields.utils'

// The fields of one inline schema, one per widget; a nullable select and a read only field of real
// schemas for their own cases.
const fields = contentFields({
  title: 'Kind',
  'x-ui-title-field': 'name',
  properties: {
    name: { type: 'string', title: 'Name' },
    note: { type: 'string', title: 'Note', 'x-ui-widget': 'textarea' },
    mood: { type: 'string', title: 'Mood', enum: ['calm', 'happy'] },
    feeling: { type: 'string', title: 'Feeling', 'x-ui-widget': 'badge', enum: ['calm', 'happy'] },
    phase: { type: 'string', title: 'Phase', 'x-ui-widget': 'separator', enum: ['open', 'closed'] },
    place: { type: 'integer', title: 'Place', 'x-ui-widget': 'separator', minimum: 1 },
    pick: {
      type: 'string',
      title: 'Pick',
      'x-ui-widget': 'select',
      'x-value-from': 'elicitation_plan.topics',
    },
    points: { type: 'integer', title: 'Points', minimum: 1, maximum: 5 },
    loud: { type: 'boolean', title: 'Loud' },
    criteria: { type: 'array', title: 'Criteria', 'x-ui-widget': 'list' },
    keywords: { type: 'array', title: 'Keywords', 'x-ui-widget': 'tags' },
    topics: {
      type: 'array',
      title: 'Topics',
      'x-ui-widget': 'tags',
      'x-value-from': 'elicitation_plan.topics',
    },
    roles: {
      type: 'array',
      title: 'Roles',
      'x-ui-widget': 'object-list',
      items: {
        type: 'object',
        required: ['who'],
        properties: {
          who: { type: 'string', title: 'Who' },
          what: { type: 'string', title: 'What' },
        },
      },
    },
  },
  required: ['name'],
})

/** The field of the inline schema with this name. */
export function fieldOf(name: string): ContentField {
  const found = fields.find((field) => field.name === name)
  if (found === undefined) throw new Error(`No field ${name}`)
  return found
}

function specFieldOf(name: string): ContentField {
  const found = contentFields(contentSchemaFixtureByKind('spec_requirement')).find(
    (field) => field.name === name,
  )
  if (found === undefined) throw new Error(`No spec field ${name}`)
  return found
}

/** How a test changes the control of a case. */
export type FieldChange =
  | { kind: 'type'; text: string }
  | { kind: 'select'; option: string }
  | { kind: 'click' }
  | { kind: 'addEntry'; text: string }
  | { kind: 'check'; label: string }

/** A widget, its field, how the test changes its control, what the form saves, and the values it may take. */
export interface WidgetCase {
  name: string
  field: ContentField
  change: FieldChange
  saved: Record<string, unknown>
  allowedValues?: readonly string[]
}

export const widgetCases: readonly WidgetCase[] = [
  {
    name: 'a text',
    field: fieldOf('name'),
    change: { kind: 'type', text: 'Bea' },
    saved: { name: 'Bea' },
  },
  {
    name: 'a textarea',
    field: fieldOf('note'),
    change: { kind: 'type', text: 'A note.' },
    saved: { note: 'A note.' },
  },
  {
    name: 'a select',
    field: fieldOf('mood'),
    change: { kind: 'select', option: 'happy' },
    saved: { mood: 'happy' },
  },
  {
    name: 'a badge',
    field: fieldOf('feeling'),
    change: { kind: 'select', option: 'happy' },
    saved: { feeling: 'happy' },
  },
  {
    name: 'a separator of a choice',
    field: fieldOf('phase'),
    change: { kind: 'select', option: 'closed' },
    saved: { phase: 'closed' },
  },
  {
    name: 'a separator of a number',
    field: fieldOf('place'),
    change: { kind: 'type', text: '3' },
    saved: { place: 3 },
  },
  {
    name: 'a number',
    field: fieldOf('points'),
    change: { kind: 'type', text: '5' },
    saved: { points: 5 },
  },
  {
    name: 'a boolean',
    field: fieldOf('loud'),
    change: { kind: 'click' },
    saved: { loud: true },
  },
  {
    name: 'a list',
    field: fieldOf('criteria'),
    change: { kind: 'addEntry', text: 'Given' },
    saved: { criteria: ['Given'] },
  },
  {
    name: 'tags the user writes',
    field: fieldOf('keywords'),
    change: { kind: 'addEntry', text: 'search' },
    saved: { keywords: ['search'] },
  },
  {
    name: 'tags with allowed values',
    field: fieldOf('topics'),
    change: { kind: 'check', label: 'search' },
    saved: { topics: ['search'] },
    allowedValues: ['search', 'booking', 'reminders'],
  },
  {
    name: 'an object list',
    field: fieldOf('roles'),
    change: { kind: 'addEntry', text: 'Ann' },
    saved: { roles: [{ who: 'Ann' }] },
  },
]

/** A nullable select of a real schema, which offers None. */
export const nullableSelect = specFieldOf('quality_category')

/** A read only field of a real schema, which shows its value without a control. */
export const readOnlyField = contentFields(contentSchemaFixtureByKind('persona')).find(
  (field) => field.name === 'interview_status',
)

/** A read only list of people, which shows its people without a control. */
export const readOnlyPeopleField = contentFields({
  title: 'Kind',
  properties: {
    people: {
      type: 'array',
      title: 'People',
      'x-ui-widget': 'avatar-list',
      readOnly: true,
      items: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          name: { type: 'string' },
          role: { type: 'string' },
          item_id: { type: ['string', 'null'] },
        },
      },
    },
  },
}).find((field) => field.name === 'people')

/** The initial content of the test form: the required field filled, so only the case changes. */
export const initialContent = { name: 'Ann' }

/** The allowed values that a select of the `pick` field takes from another artifact. */
export const pickAllowedValues = ['search', 'booking', 'reminders']
