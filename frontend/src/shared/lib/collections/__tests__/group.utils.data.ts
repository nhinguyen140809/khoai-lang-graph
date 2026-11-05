/** Cases that check how `groupBy` gathers the items of a list by a key. */
export const groupByCases = [
  {
    name: 'keys in the order they first appear',
    items: ['p1', 'q1', 'p2'],
    keyOf: (item: string) => item.slice(0, 1),
    groups: [
      { key: 'p', items: ['p1', 'p2'] },
      { key: 'q', items: ['q1'] },
    ],
  },
  {
    name: 'one key for every item',
    items: ['a', 'b'],
    keyOf: () => 'same',
    groups: [{ key: 'same', items: ['a', 'b'] }],
  },
  { name: 'no item', items: [], keyOf: (item: string) => item, groups: [] },
] as const

/** A record of a group, with its rank. */
interface Ranked {
  id: string
  group: string
  rank: number
}

/** Items, and the id of the item kept for each group, in the order of the groups. */
export const newestOfEachGroupCases: { name: string; items: Ranked[]; kept: [string, string][] }[] =
  [
    { name: 'no item', items: [], kept: [] },
    {
      name: 'the highest rank of each group, wherever it comes',
      items: [
        { id: 'a1', group: 'a', rank: 1 },
        { id: 'b2', group: 'b', rank: 2 },
        { id: 'a3', group: 'a', rank: 3 },
        { id: 'b1', group: 'b', rank: 1 },
      ],
      kept: [
        ['a', 'a3'],
        ['b', 'b2'],
      ],
    },
    {
      name: 'the first of two items of one rank',
      items: [
        { id: 'first', group: 'a', rank: 2 },
        { id: 'second', group: 'a', rank: 2 },
      ],
      kept: [['a', 'first']],
    },
  ]

/** Cases that check how `collectBy` gathers what `valueOf` gives, under the key that `keyOf`
 * gives. */
export const collectByCases: {
  name: string
  items: string[]
  keyOf: (item: string) => string | null
  valueOf: (item: string) => number
  collected: [string, number[]][]
}[] = [
  {
    name: 'the values of each key, in the order they came',
    items: ['p1', 'q1', 'p2'],
    keyOf: (item) => item.slice(0, 1),
    valueOf: (item) => item.length,
    collected: [
      ['p', [2, 2]],
      ['q', [2]],
    ],
  },
  {
    name: 'one key for every item',
    items: ['a', 'b'],
    keyOf: () => 'same',
    valueOf: (item) => item.length,
    collected: [['same', [1, 1]]],
  },
  {
    name: 'no item',
    items: [],
    keyOf: (item) => item,
    valueOf: (item) => item.length,
    collected: [],
  },
]
