/** A text, and the text with its first letter in upper case. */
export const capitalizeCases = [
  { name: 'a word', text: 'criteria', capitalized: 'Criteria' },
  { name: 'words', text: 'acceptance criteria', capitalized: 'Acceptance criteria' },
  { name: 'a text that is capitalized already', text: 'Criteria', capitalized: 'Criteria' },
  { name: 'a text in capitals', text: 'API', capitalized: 'API' },
  { name: 'an empty text', text: '', capitalized: '' },
  { name: 'a letter with a diacritic', text: 'ăn', capitalized: 'Ăn' },
  { name: 'a text that starts with a digit', text: '2fa', capitalized: '2fa' },
]

/** A name, and its initialsOf: those of its first and last words. */
export const initialsCases = [
  ['Linh Pham', 'LP'],
  ['an tran van', 'AV'],
  ['Linh', 'L'],
  ['  Linh   Pham  ', 'LP'],
  ['Nguyễn Thị Yến', 'NY'],
  ['', '?'],
  ['   ', '?'],
]

/** A snake_case key, and the sentence case text it becomes. */
export const snakeToSentenceCaseCases = [
  { name: 'a key of two words', key: 'acceptance_criteria', sentence: 'Acceptance criteria' },
  { name: 'a key of one word', key: 'title', sentence: 'Title' },
  { name: 'an empty key', key: '', sentence: '' },
]

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
