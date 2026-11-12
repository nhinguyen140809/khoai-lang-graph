import type { LoadingLayout, StateSize } from '../state.types'

/** The placeholder asked for, and the skeletons it shows: rows, and cells in each row. */
export const loadingCases: {
  name: string
  size: StateSize
  rows: number
  columns?: number
  layout?: LoadingLayout
  skeletons: number
}[] = [
  { name: 'rows in the middle of a page', size: 'page', rows: 3, skeletons: 3 },
  { name: 'rows in a narrow container', size: 'compact', rows: 2, skeletons: 2 },
  { name: 'the rows of a table', size: 'page', rows: 4, columns: 3, skeletons: 12 },
  {
    name: 'a list with a mark and two lines in each row',
    size: 'page',
    rows: 3,
    layout: 'list',
    skeletons: 9,
  },
  {
    name: 'cards with a title and two lines',
    size: 'page',
    rows: 2,
    layout: 'cards',
    skeletons: 6,
  },
  { name: 'a grid of blocks', size: 'page', rows: 2, columns: 4, layout: 'grid', skeletons: 8 },
  {
    name: 'a feed with an avatar and three lines in each entry',
    size: 'page',
    rows: 2,
    layout: 'feed',
    skeletons: 8,
  },
  {
    name: 'a document with a heading and paragraphs',
    size: 'page',
    rows: 2,
    layout: 'document',
    skeletons: 7,
  },
  { name: 'the detail of an item', size: 'page', rows: 2, layout: 'detail', skeletons: 8 },
  { name: 'cards in a narrow container', size: 'compact', rows: 1, layout: 'cards', skeletons: 3 },
]
