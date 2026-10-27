import type { ArtifactItem } from '@/modules/artifact/entities'

/** An item with the fields that the outline reads. */
const entry = (id: string, parent: string | null, position: number) =>
  ({ id, parent_item_id: parent, position, outline_number: '' }) as ArtifactItem

/** Items of one artifact, and the ids with the number and depth that the outline gives them. */
export const outlineCases = [
  {
    name: 'items with sections',
    items: [
      entry('b-req', 'b', 1),
      entry('b', 'a', 1),
      entry('a', null, 1),
      entry('c', null, 2),
      entry('a-req', 'a', 2),
    ],
    placed: [
      ['a', '1', 1],
      ['b', '1.1', 2],
      ['b-req', '1.1.1', 3],
      ['a-req', '1.2', 2],
      ['c', '2', 1],
    ],
  },
  {
    name: 'items without sections, numbered by their place',
    items: [entry('y', null, 2), entry('x', null, 1)],
    placed: [
      ['x', '1', 1],
      ['y', '2', 1],
    ],
  },
  {
    name: 'an item whose parent is not among the items',
    items: [entry('a', null, 1), entry('lost', 'gone', 2)],
    placed: [
      ['a', '1', 1],
      ['lost', '2', 1],
    ],
  },
  { name: 'no item', items: [], placed: [] },
]
