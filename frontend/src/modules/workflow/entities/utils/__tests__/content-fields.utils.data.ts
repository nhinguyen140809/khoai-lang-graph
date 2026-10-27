/** The names of the fields of a kind, in the order of its schema. */
export const fieldOrderCases = [
  {
    kind: 'spec_requirement',
    names: [
      'title',
      'statement',
      'type',
      'quality_category',
      'priority',
      'rationale',
      'acceptance_criteria',
      'fit_criterion',
      'verification_method',
    ],
  },
]

/** A field of a kind, and what its content field holds. */
export const contentFieldCases = [
  {
    name: 'a select with its options',
    kind: 'spec_requirement',
    field: 'type',
    contentField: {
      widget: 'select',
      nullable: false,
      options: ['functional', 'non_functional', 'constraint'],
    },
  },
  {
    name: 'a list',
    kind: 'spec_requirement',
    field: 'acceptance_criteria',
    contentField: { widget: 'list' },
  },
  {
    name: 'a text area',
    kind: 'spec_requirement',
    field: 'statement',
    contentField: { widget: 'textarea' },
  },
  {
    name: 'a field that can be null',
    kind: 'spec_requirement',
    field: 'fit_criterion',
    contentField: { nullable: true },
  },
  {
    name: 'a field the user cannot edit',
    kind: 'persona',
    field: 'interview_status',
    contentField: { readOnly: true },
  },
  {
    name: 'a select that takes its values from an artifact',
    kind: 'persona',
    field: 'stakeholder_type',
    contentField: { allowedValuesFrom: 'elicitation_plan.stakeholder_types' },
  },
  {
    name: 'a list of objects with the fields of an entry',
    kind: 'backlog_item',
    field: 'acceptance_criteria',
    contentField: {
      widget: 'object-list',
      entryFields: [{ name: 'given' }, { name: 'when' }, { name: 'then' }],
    },
  },
]

/** A kind and the display that its schema names. */
export const displayCases = [
  { kind: 'requirement_specification', display: 'document' },
  { kind: 'section', display: 'heading' },
  { kind: 'persona', display: 'cards' },
  { kind: 'interview_message', display: 'transcript' },
  { kind: 'spec_requirement', display: 'table' },
]

/** A schema that names no known display, and the display that is used instead. */
export const displayFallbackCases = [
  {
    name: 'an artifact without a display',
    schema: { title: 'Kind', 'x-level': 'artifact' },
    display: 'document',
  },
  {
    name: 'an item without a display',
    schema: { title: 'Kind', 'x-level': 'item' },
    display: 'table',
  },
  {
    name: 'an item with an unknown display',
    schema: { title: 'Kind', 'x-level': 'item', 'x-ui-display': 'kanban' },
    display: 'table',
  },
  {
    name: 'an artifact with an unknown display',
    schema: { title: 'Kind', 'x-level': 'artifact', 'x-ui-display': 'kanban' },
    display: 'document',
  },
  { name: 'a schema without a level', schema: { title: 'Kind' }, display: 'table' },
]

/** An item kind and the fields that a table of its items shows. */
export const listFieldCases = [
  {
    kind: 'spec_requirement',
    names: ['title', 'type', 'priority', 'verification_method'],
  },
]

/** What an item is called, by the schema of its kind. */
export const itemTitleCases = [
  {
    name: 'its title field',
    kind: 'spec_requirement',
    item: { key: 'REQ-001', content: { title: 'Search mentors' } },
    title: 'Search mentors',
  },
  {
    name: 'its key when the title field is empty',
    kind: 'spec_requirement',
    item: { key: 'REQ-002', content: {} },
    title: 'REQ-002',
  },
  {
    name: 'its key when the title field is spaces',
    kind: 'spec_requirement',
    item: { key: 'REQ-003', content: { title: '  ' } },
    title: 'REQ-003',
  },
  {
    name: 'its key when the kind has no schema',
    kind: null,
    item: { key: 'X-1', content: { title: 'x' } },
    title: 'X-1',
  },
]
