const validRequirement = {
  title: 'Search mentors',
  statement: 'The system shall list mentors.',
  type: 'functional',
  quality_category: null,
  priority: 'must',
  rationale: 'Because.',
  acceptance_criteria: [],
  fit_criterion: null,
  verification_method: 'test',
}

const validStory = {
  item_type: 'user_story',
  title: 'Book',
  as_a: null,
  i_want: null,
  so_that: null,
  acceptance_criteria: [{ given: 'a', when: 'b', then: 'c' }],
  priority: 'must',
  story_points: 3,
  delivery_status: 'todo',
}

/** A content, and the problems that its kind finds in it by field. */
export const validateCases = [
  {
    name: 'a content that follows the schema',
    kind: 'spec_requirement',
    content: validRequirement,
    problems: {},
  },
  {
    name: 'a required field that is empty and a value that is not offered',
    kind: 'spec_requirement',
    content: { ...validRequirement, title: '', type: 'wish' },
    problems: { title: 'Enter a value.', type: 'Choose one of the values.' },
  },
  {
    name: 'a required field of spaces',
    kind: 'spec_requirement',
    content: { ...validRequirement, title: '   ' },
    problems: { title: 'Enter a value.' },
  },
  {
    name: 'an entry of a list of objects that misses a field',
    kind: 'backlog_item',
    content: { ...validStory, acceptance_criteria: [{ given: 'a', when: '', then: 'c' }] },
    problems: { acceptance_criteria: 'Fill in "When" in every entry.' },
  },
  {
    name: 'a number that is not a number',
    kind: 'backlog_item',
    content: { ...validStory, story_points: 'x' },
    problems: { story_points: 'Enter a number.' },
  },
  {
    name: 'a fraction where a whole number is asked',
    kind: 'backlog_item',
    content: { ...validStory, story_points: 2.5 },
    problems: { story_points: 'Enter a whole number.' },
  },
  {
    name: 'a field that the user cannot edit',
    kind: 'persona',
    content: { interview_status: 'bogus' },
    // The other required fields of the persona are missing; the read-only field is not checked.
    problems: null,
  },
]

/** A content, and the content that the API stores for it. */
export const storedContentCases = [
  {
    name: 'a number given as text',
    kind: 'backlog_item',
    content: { title: 'x', story_points: '5' },
    stored: { title: 'x', story_points: 5 },
  },
  {
    name: 'an empty field that can be null',
    kind: 'backlog_item',
    content: { title: 'x', as_a: '' },
    stored: { title: 'x', as_a: null },
  },
  {
    name: 'a field of spaces that can be null',
    kind: 'backlog_item',
    content: { title: 'x', as_a: '  ' },
    stored: { title: 'x', as_a: null },
  },
]

/** A field and the value that it starts with. */
export const initialValueCases = [
  { name: 'a list', kind: 'spec_requirement', field: 'acceptance_criteria', value: [] },
  { name: 'a text', kind: 'spec_requirement', field: 'title', value: '' },
  {
    name: 'a text that can be null',
    kind: 'spec_requirement',
    field: 'fit_criterion',
    value: null,
  },
]

/** Two contents, and the names of the fields that differ. */
export const changedFieldCases = [
  {
    name: 'one field',
    before: { title: 'a', type: 'x' },
    after: { title: 'b', type: 'x' },
    names: ['title'],
  },
  { name: 'a field that was missing', before: {}, after: { title: 'b' }, names: ['title'] },
  { name: 'a field that is null and missing', before: { title: null }, after: {}, names: [] },
  {
    name: 'a list in another order',
    before: { acceptance_criteria: ['a', 'b'] },
    after: { acceptance_criteria: ['b', 'a'] },
    names: ['acceptance_criteria'],
  },
]

/** The entries of an object list that differ in the order of their keys only, and in one value. */
export const entryCases = [
  {
    name: 'the keys of an entry in another order',
    after: [{ then: 'c', given: 'a', when: 'b' }],
    names: [],
  },
  {
    name: 'a value of an entry',
    after: [{ given: 'a', when: 'b', then: 'd' }],
    names: ['acceptance_criteria'],
  },
  {
    name: 'an entry less',
    after: [],
    names: ['acceptance_criteria'],
  },
]

export const valueTitleCases = [
  { name: 'a value of the list', list: 'priority', value: 'must', title: 'Must' },
  { name: 'a value the list lacks', list: 'priority', value: 'later', title: 'later' },
  { name: 'a field that names no list', list: null, value: 'must', title: 'must' },
  { name: 'a list the definition lacks', list: 'unknown', value: 'must', title: 'must' },
]
