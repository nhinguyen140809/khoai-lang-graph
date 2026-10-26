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
