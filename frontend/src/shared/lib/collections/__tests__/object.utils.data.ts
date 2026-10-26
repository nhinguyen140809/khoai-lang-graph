/** A record, the keys to drop, and the record that is left. */
export const omitCases = [
  { name: 'one key', record: { a: 1, b: 2 }, keys: ['a'], left: { b: 2 } },
  { name: 'several keys', record: { a: 1, b: 2, c: 3 }, keys: ['a', 'c'], left: { b: 2 } },
  { name: 'a key it does not have', record: { a: 1 }, keys: ['z'], left: { a: 1 } },
  { name: 'no key', record: { a: 1 }, keys: [], left: { a: 1 } },
  {
    name: 'a key with an empty value',
    record: { a: undefined, b: 2 },
    keys: ['b'],
    left: { a: undefined },
  },
]
