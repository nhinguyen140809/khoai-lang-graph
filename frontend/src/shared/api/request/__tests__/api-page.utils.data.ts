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
