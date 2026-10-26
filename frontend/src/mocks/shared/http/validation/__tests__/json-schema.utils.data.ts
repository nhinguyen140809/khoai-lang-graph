const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'points'],
  properties: {
    title: { type: 'string' },
    points: { type: ['integer', 'null'], minimum: 1, maximum: 13 },
    kind: { type: 'string', enum: ['epic', 'story'] },
    tags: { type: 'array', minItems: 1, items: { type: 'string' } },
  },
}

/** A schema, a value and the fields with a problem. */
export const schemaProblemCases = [
  { name: 'a value that fits', value: { title: 'a', points: 3 }, fields: [] },
  { name: 'a null where null is allowed', value: { title: 'a', points: null }, fields: [] },
  { name: 'a field that is missing', value: { title: 'a' }, fields: ['content.points'] },
  {
    name: 'a field the schema does not have',
    value: { title: 'a', points: 1, bogus: 1 },
    fields: ['content.bogus'],
  },
  { name: 'a text for a number', value: { title: 'a', points: 'x' }, fields: ['content.points'] },
  {
    name: 'a decimal for an integer',
    value: { title: 'a', points: 1.5 },
    fields: ['content.points'],
  },
  {
    name: 'a number under the minimum',
    value: { title: 'a', points: 0 },
    fields: ['content.points'],
  },
  {
    name: 'a number over the maximum',
    value: { title: 'a', points: 14 },
    fields: ['content.points'],
  },
  {
    name: 'a value outside the enum',
    value: { title: 'a', points: 1, kind: 'nobody' },
    fields: ['content.kind'],
  },
  {
    name: 'an empty list under minItems',
    value: { title: 'a', points: 1, tags: [] },
    fields: ['content.tags'],
  },
  {
    name: 'an entry of the wrong type',
    value: { title: 'a', points: 1, tags: ['x', 2] },
    fields: ['content.tags.1'],
  },
  { name: 'a list for the object', value: [], fields: ['content'] },
]

export { schema }
