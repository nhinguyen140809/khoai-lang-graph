import type { ObjectSchema } from '../../definition/workflow-definition.types'

/** A schema with one parameter of each type that has a widget, and two that have none. */
export const parametersSchema: ObjectSchema = {
  type: 'object',
  properties: {
    max_turns: {
      type: 'integer',
      title: 'Turns',
      minimum: 1,
      maximum: 20,
      default: 6,
      description: 'Turns.',
    },
    budget: { type: 'number' },
    strict: { type: 'boolean', default: false },
    mode: { type: 'string', enum: ['fast', 'deep'] },
    note: { type: 'string' },
    roles: { type: 'array', items: { type: 'string' } },
    nested: { type: 'object', properties: {} },
  },
}

/** A property of the schema, and what its field holds. */
export const fieldCases = [
  {
    name: 'an integer with limits',
    property: 'max_turns',
    field: {
      title: 'Turns',
      widget: 'number',
      integer: true,
      minimum: 1,
      maximum: 20,
      defaultValue: 6,
      description: 'Turns.',
    },
  },
  {
    name: 'a number that may have a fraction',
    property: 'budget',
    field: {
      title: 'Budget',
      widget: 'number',
      integer: false,
      minimum: null,
      maximum: null,
      defaultValue: null,
    },
  },
  { name: 'a flag', property: 'strict', field: { widget: 'boolean', defaultValue: false } },
  {
    name: 'a choice',
    property: 'mode',
    field: { widget: 'select', options: ['fast', 'deep'] },
  },
  { name: 'a text', property: 'note', field: { widget: 'text', options: [] } },
]

/** Values, and the problem found at each parameter. */
export const problemCases = [
  { name: 'values that are not set', values: { max_turns: '', strict: null }, problems: {} },
  {
    name: 'a number out of its limits',
    values: { max_turns: 21 },
    problems: { max_turns: 'Enter 20 or less.' },
  },
  {
    name: 'a number under its limits',
    values: { max_turns: 0 },
    problems: { max_turns: 'Enter 1 or more.' },
  },
  {
    name: 'a fraction where a whole number is asked',
    values: { max_turns: 2.5 },
    problems: { max_turns: 'Enter a whole number.' },
  },
  {
    name: 'a value that is not offered',
    values: { mode: 'other' },
    problems: { mode: 'Choose one of the values.' },
  },
  { name: 'a flag, which has no limits', values: { strict: false }, problems: {} },
]

/** Values of the parameters, and what is sent. */
export const sentCases = [
  {
    name: 'only the parameters that are set',
    values: { max_turns: '8', strict: null, note: '  ', mode: 'fast' },
    sent: { max_turns: 8, mode: 'fast' },
  },
  { name: 'a flag that is true', values: { strict: true }, sent: { strict: true } },
  { name: 'a flag that is false', values: { strict: false }, sent: { strict: false } },
  { name: 'nothing that is set', values: { max_turns: '', strict: null }, sent: {} },
]
