import type { ContentField } from '../../fields/content-fields.types'

function field(overrides: Partial<ContentField>): ContentField {
  return {
    name: 'field',
    path: 'note.field',
    title: 'Field',
    widget: 'text',
    nullable: false,
    required: false,
    readOnly: false,
    options: [],
    description: null,
    allowedValuesFrom: null,
    valueList: null,
    minItems: null,
    minimum: null,
    maximum: null,
    integer: false,
    defaultValue: null,
    entryFields: [],
    ...overrides,
  }
}

export const objectListCase = {
  field: field({
    widget: 'object-list',
    entryFields: [field({ name: 'who', title: 'Who' }), field({ name: 'what', title: 'What' })],
  }),
  value: [{ who: 'Ann', what: '' }],
  shown: ['Who:', 'Ann'],
}

export const valueCases = [
  { name: 'a text', field: field({}), value: 'First line', shown: ['First line'] },
  {
    name: 'a select with a value list',
    field: field({ widget: 'select', valueList: 'priority' }),
    value: 'must',
    shown: ['Must have'],
  },
  {
    name: 'a select with labels written for its field',
    field: field({ widget: 'select', path: 'interview_transcript.stop_reason' }),
    value: 'max_turns',
    shown: ['Turn limit reached'],
  },
  {
    name: 'a select with no labels',
    field: field({ widget: 'select', path: 'note.mood' }),
    value: 'needs_work',
    shown: ['Needs work'],
  },
  { name: 'a number', field: field({ widget: 'number' }), value: 3, shown: ['3'] },
  { name: 'yes', field: field({ widget: 'boolean' }), value: true, shown: ['Yes'] },
  { name: 'no', field: field({ widget: 'boolean' }), value: false, shown: ['No'] },
  {
    name: 'a list',
    field: field({ widget: 'list' }),
    value: ['one', 'two'],
    shown: ['one', 'two'],
  },
  { name: 'tags', field: field({ widget: 'tags' }), value: ['a', 'b'], shown: ['a', 'b'] },
  { name: 'an object list', ...objectListCase },
]

export const emptyCases = [
  { name: 'null', value: null },
  { name: 'whitespace', value: '   ' },
  { name: 'an empty list', value: [] },
]

export { field }
