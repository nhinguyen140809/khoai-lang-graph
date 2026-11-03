import type { ListPage } from '@/shared/api/request'

const page = (items: string[], next_cursor: string | null): ListPage<string> => ({
  items,
  next_cursor,
})

/** The pages of an infinite query, and the items that they hold in order. */
export const pageCases = [
  { name: 'no data yet', data: undefined, items: [] },
  {
    name: 'one page',
    data: { pages: [page(['a', 'b'], null)], pageParams: [null] },
    items: ['a', 'b'],
  },
  {
    name: 'two pages',
    data: { pages: [page(['a'], 'c1'), page(['b', 'c'], null)], pageParams: [null, 'c1'] },
    items: ['a', 'b', 'c'],
  },
]
