/** A map, the key set, and the entries that the map holds after it, in order. */
export const setEntryCases = [
  {
    name: 'a new key, which goes last',
    map: [['a', 1]],
    key: 'b',
    value: 2,
    entries: [
      ['a', 1],
      ['b', 2],
    ],
  },
  {
    name: 'a key that is there, which keeps its place',
    map: [
      ['a', 1],
      ['b', 2],
    ],
    key: 'a',
    value: 9,
    entries: [
      ['a', 9],
      ['b', 2],
    ],
  },
  { name: 'a key of an empty map', map: [], key: 'a', value: 1, entries: [['a', 1]] },
] as const

/** A map, the key removed, and the entries that the map holds after it, in order. */
export const removeEntryCases = [
  {
    name: 'a key that is there',
    map: [
      ['a', 1],
      ['b', 2],
    ],
    key: 'a',
    entries: [['b', 2]],
  },
  { name: 'the last key', map: [['a', 1]], key: 'a', entries: [] },
  { name: 'a key that is not there', map: [['a', 1]], key: 'z', entries: [['a', 1]] },
] as const
