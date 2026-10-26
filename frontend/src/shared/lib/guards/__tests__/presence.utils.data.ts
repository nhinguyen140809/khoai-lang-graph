/** A value, and whether it is absent or a string of whitespace. */
export const blankCases = [
  { name: 'null', value: null, expected: true },
  { name: 'undefined', value: undefined, expected: true },
  { name: 'an empty string', value: '', expected: true },
  { name: 'a string of whitespace', value: '  ', expected: true },
  { name: 'spaces and a new line', value: ' \n\t', expected: true },
  { name: 'a word', value: 'a word', expected: false },
  { name: 'a word between spaces', value: '  a ', expected: false },
  { name: 'the number zero', value: 0, expected: false },
  { name: 'false', value: false, expected: false },
  { name: 'an empty list', value: [], expected: false },
] as const

/** A value, and whether it is blank or an empty list. */
export const emptyCases = [
  { name: 'null', value: null, expected: true },
  { name: 'undefined', value: undefined, expected: true },
  { name: 'an empty string', value: '', expected: true },
  { name: 'a string of whitespace', value: '  ', expected: true },
  { name: 'an empty list', value: [], expected: true },
  { name: 'a list with an entry', value: [1], expected: false },
  { name: 'a list with an empty entry', value: [''], expected: false },
  { name: 'a word', value: 'a word', expected: false },
  { name: 'the number zero', value: 0, expected: false },
  { name: 'an object without keys', value: {}, expected: false },
] as const

/** A value, and whether it is a string with more than whitespace. */
export const hasTextCases = [
  { name: 'a word', value: 'a', expected: true },
  { name: 'a word between spaces', value: '  a ', expected: true },
  { name: 'an empty string', value: '', expected: false },
  { name: 'spaces and a new line', value: ' \n\t', expected: false },
  { name: 'a number', value: 1, expected: false },
  { name: 'a list of words', value: ['a'], expected: false },
  { name: 'null', value: null, expected: false },
  { name: 'undefined', value: undefined, expected: false },
] as const

/** A value that is there, and the value `required` gives back; falsy values count as there. */
export const requiredCases = [
  { name: 'a word', value: 'a' },
  { name: 'an empty string', value: '' },
  { name: 'the number zero', value: 0 },
  { name: 'false', value: false },
  { name: 'an empty list', value: [] },
] as const

/** A value that is not there, such as a record that a lookup did not find. */
export const missingCases = [
  { name: 'undefined', value: undefined },
  { name: 'null', value: null },
] as const
