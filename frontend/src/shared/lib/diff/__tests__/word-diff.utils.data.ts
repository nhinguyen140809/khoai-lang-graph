import type { DiffPart } from '../diff.types'

// The exact parts each case gives, down to where jsdiff puts the spaces of the text.
export const wordDiffCases: {
  name: string
  before: string
  after: string
  expected: DiffPart[]
}[] = [
  {
    name: 'two equal texts',
    before: 'The system shall let a student search mentors.',
    after: 'The system shall let a student search mentors.',
    expected: [{ text: 'The system shall let a student search mentors.', change: 'same' }],
  },
  {
    name: 'a word changed in the middle',
    before: 'The system shall let a student search mentors.',
    after: 'The system shall let a student find mentors.',
    expected: [
      { text: 'The system shall let a student ', change: 'same' },
      { text: 'search', change: 'removed' },
      { text: 'find', change: 'added' },
      { text: ' mentors.', change: 'same' },
    ],
  },
  {
    name: 'a whole text removed',
    before: 'Deleted before the run went on.',
    after: '',
    expected: [{ text: 'Deleted before the run went on.', change: 'removed' }],
  },
  {
    name: 'a whole text added',
    before: '',
    after: 'Added by the analyst.',
    expected: [{ text: 'Added by the analyst.', change: 'added' }],
  },
  {
    name: 'two empty texts',
    before: '',
    after: '',
    expected: [],
  },
  {
    name: 'a change of spaces alone',
    before: 'a  b',
    after: 'a b',
    expected: [{ text: 'a b', change: 'same' }],
  },
  {
    name: 'a line added at the end',
    before: '1. Results within 2 s\n2. Filters for field and availability',
    after: '1. Results within 2 s\n2. Filters for field and availability\n3. Sorts by best match',
    expected: [
      {
        text: '1. Results within 2 s\n2. Filters for field and availability\n',
        change: 'same',
      },
      { text: '3. Sorts by best match', change: 'added' },
    ],
  },
]
