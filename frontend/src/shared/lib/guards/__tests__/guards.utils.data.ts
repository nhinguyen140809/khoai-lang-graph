/** A value, and whether it is an object with keys. */
export const recordCases = [
  { name: 'an object', value: { a: 1 }, expected: true },
  { name: 'an empty object', value: {}, expected: true },
  { name: 'nested objects', value: { a: { b: 1 } }, expected: true },
  { name: 'null', value: null, expected: false },
  { name: 'undefined', value: undefined, expected: false },
  { name: 'a list', value: [{ a: 1 }], expected: false },
  { name: 'an empty list', value: [], expected: false },
  { name: 'a string', value: 'a', expected: false },
  { name: 'a number', value: 1, expected: false },
  { name: 'a function', value: () => undefined, expected: false },
]

const colors = ['red', 'green'] as const

/** A list, a value, and whether the value is one of the list. */
export const oneOfCases = [
  { name: 'a value of the list', values: colors, value: 'green', expected: true },
  { name: 'a value that is not in the list', values: colors, value: 'blue', expected: false },
  { name: 'the same word in another case', values: colors, value: 'Red', expected: false },
  { name: 'a value of another type', values: colors, value: 1, expected: false },
  { name: 'undefined', values: colors, value: undefined, expected: false },
  { name: 'any value of an empty list', values: [], value: 'red', expected: false },
]

/** A value, and whether it is a string. */
export const isStringCases = [
  { name: 'a text', value: 'a', expected: true },
  { name: 'an empty text', value: '', expected: true },
  { name: 'a text of whitespace', value: '  ', expected: true },
  { name: 'a number', value: 1, expected: false },
  { name: 'a list of texts', value: ['a'], expected: false },
  { name: 'null', value: null, expected: false },
  { name: 'undefined', value: undefined, expected: false },
]
