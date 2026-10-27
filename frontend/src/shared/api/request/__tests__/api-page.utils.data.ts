import { apiEndpoint } from '../../endpoints'

/** The endpoint that the tests of the pages read. */
export const things = apiEndpoint('/things')

/** A path, the page asked for, and the query that the request sends. */
export const pageCases = [
  {
    name: 'the first page, keeping the query of the path',
    path: `${things.path()}?status=active`,
    limit: 50,
    cursor: null,
    query: '?status=active&limit=50',
  },
  {
    name: 'the page after a cursor',
    path: things.path(),
    limit: 10,
    cursor: '10',
    query: '?limit=10&cursor=10',
  },
]

/** The cursors that the server answers in turn, and the ids it holds on each page. */
export const allPagesCases = [
  { name: 'one page', pages: [{ ids: ['a'], next: null }], ids: ['a'], queries: ['?limit=2'] },
  {
    name: 'several pages, following each cursor',
    pages: [
      { ids: ['a', 'b'], next: '2' },
      { ids: ['c'], next: null },
    ],
    ids: ['a', 'b', 'c'],
    queries: ['?limit=2', '?limit=2&cursor=2'],
  },
]
