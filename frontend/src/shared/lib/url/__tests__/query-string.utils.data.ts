/** Cases that check the query that `queryString` builds from parameters. */
export const queryStringCases = [
  {
    name: 'a kind and a version',
    params: { kind: 'analysis', version: 2 },
    query: '?kind=analysis&version=2',
  },
  { name: 'a number written as text', params: { page: 3 }, query: '?page=3' },
  { name: 'the number zero', params: { page: 0 }, query: '?page=0' },
  { name: 'an empty text', params: { text: '' }, query: '?text=' },
  {
    name: 'a text with spaces and symbols',
    params: { text: 'a b&c=d' },
    query: '?text=a+b%26c%3Dd',
  },
  { name: 'a text with accents', params: { text: 'nguyễn' }, query: '?text=nguy%E1%BB%85n' },
  { name: 'a parameter without a value', params: { kind: undefined }, query: '' },
  {
    name: 'a parameter without a value between two others',
    params: { a: '1', b: undefined, c: '3' },
    query: '?a=1&c=3',
  },
  { name: 'no parameter at all', params: {}, query: '' },
  {
    name: 'a list, once for each entry',
    params: { status: ['running', 'failed'], page: 2 },
    query: '?status=running&status=failed&page=2',
  },
  { name: 'a list of one entry', params: { status: ['running'] }, query: '?status=running' },
  { name: 'an empty list', params: { status: [] }, query: '' },
] as const

/** Cases that check the query that `queryStringOf` writes in an address. */
export const queryStringOfCases = [
  { name: 'no query', query: '', queryString: '' },
  { name: 'a kind', query: 'kind=a', queryString: '?kind=a' },
  { name: 'a kind and a version', query: 'kind=a&version=2', queryString: '?kind=a&version=2' },
] as const
