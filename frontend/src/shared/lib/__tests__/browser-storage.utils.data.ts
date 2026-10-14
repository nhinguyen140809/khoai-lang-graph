/** A stored value, and what `parseStored` reads from it with a schema of `{ width: number }`. */
export const parseStoredCases = [
  { name: 'a value of the expected shape', value: { width: 260 }, parsed: { width: 260 } },
  {
    name: 'the fields of the shape only',
    value: { width: 260, height: 40 },
    parsed: { width: 260 },
  },
  { name: 'nothing for a field of another type', value: { width: '260' }, parsed: undefined },
  { name: 'nothing for null', value: null, parsed: undefined },
  { name: 'nothing for nothing stored', value: undefined, parsed: undefined },
]
