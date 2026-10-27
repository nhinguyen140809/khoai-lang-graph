/** A value and the text that a cell shows for it. */
export const jsonToPlainTextCases = [
  { name: 'null', value: null, text: '-' },
  { name: 'an empty text', value: '', text: '-' },
  { name: 'spaces only', value: '  ', text: '-' },
  { name: 'a number', value: 3, text: '3' },
  { name: 'a list of texts', value: ['a', 'b'], text: 'a; b' },
  { name: 'a list of objects', value: [{ given: 'a', then: 'b' }], text: 'a / b' },
  { name: 'an object', value: { a: 1 }, text: '{"a":1}' },
]
