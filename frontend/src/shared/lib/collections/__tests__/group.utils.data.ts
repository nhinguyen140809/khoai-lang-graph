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
