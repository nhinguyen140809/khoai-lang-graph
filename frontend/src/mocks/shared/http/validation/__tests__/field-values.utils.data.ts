/** A value of a field, and what `optionalText` reads of it. */
export const optionalTextCases = [
  { name: 'a text', value: 'Mentors', expected: 'Mentors' },
  { name: 'an empty text', value: '', expected: '' },
  { name: 'a field left out', value: undefined, expected: null },
  { name: 'a field set to null', value: null, expected: null },
  { name: 'a number', value: 3, expected: undefined },
  { name: 'a list', value: ['a'], expected: undefined },
  { name: 'an object', value: { a: 1 }, expected: undefined },
  { name: 'a boolean', value: false, expected: undefined },
]

/** A value of a field, and what `positiveInteger` reads of it. */
export const positiveIntegerCases = [
  { name: 'one', value: 1, expected: 1 },
  { name: 'a larger whole number', value: 12, expected: 12 },
  { name: 'zero', value: 0, expected: undefined },
  { name: 'a negative number', value: -3, expected: undefined },
  { name: 'a fraction', value: 1.5, expected: undefined },
  { name: 'a number written as text', value: '2', expected: undefined },
  { name: 'a field left out', value: undefined, expected: undefined },
]

/** The values that `choice` accepts in its cases. */
export const statuses = ['active', 'archived'] as const

/** A value of a field, and what `requiredText` reads of it. */
export const requiredTextCases = [
  { name: 'a text', value: 'Mentors', expected: 'Mentors' },
  { name: 'a text with space around it', value: '  Mentors  ', expected: 'Mentors' },
  { name: 'an empty text', value: '', expected: undefined },
  { name: 'a text of spaces', value: '   ', expected: undefined },
  { name: 'a field left out', value: undefined, expected: undefined },
  { name: 'null', value: null, expected: undefined },
  { name: 'a number', value: 3, expected: undefined },
]

/** A value of a field, and what `choice` reads of it among `statuses`. */
export const choiceCases = [
  { name: 'a value of the list', value: 'archived', expected: 'archived' },
  { name: 'another text', value: 'deleted', expected: undefined },
  { name: 'the same text in another case', value: 'Active', expected: undefined },
  { name: 'a field left out', value: undefined, expected: undefined },
  { name: 'a number', value: 1, expected: undefined },
]

/** A value of a field, and what `jsonObject` reads of it. */
export const jsonObjectCases = [
  { name: 'an object', value: { a: 1 }, expected: { a: 1 } },
  { name: 'an empty object', value: {}, expected: {} },
  { name: 'a list', value: ['a'], expected: undefined },
  { name: 'null', value: null, expected: undefined },
  { name: 'a text', value: 'a', expected: undefined },
  { name: 'a field left out', value: undefined, expected: undefined },
]

/** A value of a field, and what `jsonBoolean` reads of it. */
export const jsonBooleanCases = [
  { name: 'true', value: true, expected: true },
  { name: 'false', value: false, expected: false },
  { name: 'a text', value: 'true', expected: undefined },
  { name: 'a number', value: 1, expected: undefined },
  { name: 'a field left out', value: undefined, expected: undefined },
]

/** A value of a field, and whether it is sent wrong when the field must hold a `requiredText`. */
export const isSentButInvalidCases = [
  { name: 'a field left out is not wrong', value: undefined, expected: false },
  { name: 'a text is not wrong', value: 'Mentors', expected: false },
  { name: 'a blank text is wrong', value: '  ', expected: true },
  { name: 'null is wrong', value: null, expected: true },
  { name: 'a number is wrong', value: 3, expected: true },
]
