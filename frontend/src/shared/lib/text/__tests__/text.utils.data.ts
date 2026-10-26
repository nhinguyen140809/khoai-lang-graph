/** A text, a part, and whether the text holds the part in any case or accent. */
export const includesTextCases = [
  { name: 'the same case', text: 'Search mentors', part: 'mentors', found: true },
  { name: 'another case', text: 'Search MENTORS', part: 'Mentors', found: true },
  {
    name: 'a part that is not in the text',
    text: 'Search mentors',
    part: 'sessions',
    found: false,
  },
  { name: 'an empty part', text: 'Search mentors', part: '', found: true },
  {
    name: 'a part without the accents of the text',
    text: 'Nguyễn Văn',
    part: 'nguyen van',
    found: true,
  },
  { name: 'a part with accents that the text lacks', text: 'nguyen', part: 'Nguyễn', found: true },
  { name: 'a part longer than the text', text: 'Search', part: 'Search mentors', found: false },
]

/** A text, and the text as it is searched: in lower case, without accents. */
export const foldTextCases = [
  { name: 'upper case', text: 'MENTORS', folded: 'mentors' },
  { name: 'Vietnamese accents', text: 'Nguyễn Thị Yến', folded: 'nguyen thi yen' },
  { name: 'the letter d with a stroke', text: 'Đặng', folded: 'dang' },
  { name: 'a text without accents', text: 'plain', folded: 'plain' },
  { name: 'an empty text', text: '', folded: '' },
]
