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
    rating: null,
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

export const ratingListCase = {
  field: field({
    widget: 'rating-list',
    entryFields: [
      field({ name: 'aspect', title: 'Aspect' }),
      field({ name: 'score', title: 'Score', widget: 'number' }),
      field({ name: 'rationale', title: 'Why' }),
    ],
    rating: { label: 'aspect', value: 'score', note: 'rationale', min: 1, max: 5 },
  }),
  value: [
    {
      aspect: 'Comfortable with technology',
      score: 4,
      rationale: 'Uses his phone for everything.',
    },
    {
      aspect: 'Has a say in the decision',
      score: 1,
      rationale: 'Students do not choose the system.',
    },
  ],
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
  {
    name: 'a separator of a choice',
    field: field({ widget: 'separator', options: ['on', 'off'] }),
    value: 'on',
    shown: ['On'],
  },
  {
    name: 'a separator of a number',
    field: field({ widget: 'separator', integer: true }),
    value: 2,
    shown: ['2'],
  },
]

export const emptyCases = [
  { name: 'null', value: null },
  { name: 'whitespace', value: '   ' },
  { name: 'an empty list', value: [] },
]

export { field }
