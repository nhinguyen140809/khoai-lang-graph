const sentence = 'Mentors can search mentors by field. MENTORS see sessions.'

/** A text, a query, the options of the match, and where the query sits in the text. */
export const queryCases = [
  {
    name: 'every place of a word, in any case',
    text: sentence,
    query: 'mentors',
    options: {},
    expected: [
      { start: 0, end: 7 },
      { start: 19, end: 26 },
      { start: 37, end: 44 },
    ],
  },
  {
    name: 'the first place only',
    text: sentence,
    query: 'mentors',
    options: { matchAll: false },
    expected: [{ start: 0, end: 7 }],
  },
  {
    name: 'only the places in the same case',
    text: sentence,
    query: 'mentors',
    options: { ignoreCase: false },
    expected: [{ start: 19, end: 26 }],
  },
  {
    name: 'several words, in the order of the text',
    text: sentence,
    query: ['sessions', 'field'],
    options: {},
    expected: [
      { start: 30, end: 35 },
      { start: 49, end: 57 },
    ],
  },
  {
    name: 'the longer word where two words start at the same place',
    text: 'search sessions',
    query: ['se', 'search'],
    options: { matchAll: false },
    expected: [{ start: 0, end: 6 }],
  },
  {
    name: 'a word without the accents of the text',
    text: 'Nguyễn Văn and nguyễn',
    query: 'nguyen',
    options: {},
    expected: [
      { start: 0, end: 6 },
      { start: 15, end: 21 },
    ],
  },
  {
    name: 'a word in a text whose accents are separate characters',
    text: 'Nguyễn',
    query: 'nguyen',
    options: {},
    expected: [{ start: 0, end: 8 }],
  },
  {
    name: 'a word with signs that a pattern reads as its own',
    text: 'Pay (2 x $5) now?',
    query: '(2 x $5)',
    options: {},
    expected: [{ start: 4, end: 12 }],
  },
  { name: 'an empty word', text: sentence, query: '', options: {}, expected: [] },
  {
    name: 'a word that is not in the text',
    text: sentence,
    query: 'tutor',
    options: {},
    expected: [],
  },
]

/** A text, some ranges that may overlap or run past it, and the pieces it is cut into. */
export const splitCases = [
  {
    name: 'the words between the ranges and the words of the ranges',
    text: 'Search mentors by field',
    ranges: [
      { start: 7, end: 14 },
      { start: 18, end: 23 },
    ],
    expected: [
      { text: 'Search ', isRange: false },
      { text: 'mentors', isRange: true },
      { text: ' by ', isRange: false },
      { text: 'field', isRange: true },
    ],
  },
  {
    name: 'ranges given out of order',
    text: 'abcdef',
    ranges: [
      { start: 4, end: 6 },
      { start: 0, end: 2 },
    ],
    expected: [
      { text: 'ab', isRange: true },
      { text: 'cd', isRange: false },
      { text: 'ef', isRange: true },
    ],
  },
  {
    name: 'the first of two ranges that overlap',
    text: 'abcdef',
    ranges: [
      { start: 1, end: 4 },
      { start: 3, end: 5 },
    ],
    expected: [
      { text: 'a', isRange: false },
      { text: 'bcd', isRange: true },
      { text: 'ef', isRange: false },
    ],
  },
  {
    name: 'a range cut to the text, and a range with nothing in it left out',
    text: 'abc',
    ranges: [
      { start: 2, end: 9 },
      { start: 1, end: 1 },
    ],
    expected: [
      { text: 'ab', isRange: false },
      { text: 'c', isRange: true },
    ],
  },
  {
    name: 'the whole text as one piece when there is no range',
    text: 'abc',
    ranges: [],
    expected: [{ text: 'abc', isRange: false }],
  },
  { name: 'nothing for an empty text', text: '', ranges: [{ start: 0, end: 2 }], expected: [] },
]
