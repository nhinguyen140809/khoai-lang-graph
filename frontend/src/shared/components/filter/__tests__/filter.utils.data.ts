import type { FilterValues } from '../filter.types'

/** Values, and how many filters have one. */
export const countCases: { name: string; values: FilterValues; count: number }[] = [
  { name: 'no filter', values: {}, count: 0 },
  { name: 'a filter emptied', values: { status: [] }, count: 0 },
  { name: 'two filters', values: { status: ['open', 'closed'], period: ['1'] }, count: 2 },
]

/** The parameters of an address, and the values of the filters they hold. */
export const addressValuesCases: { name: string; query: string; values: FilterValues }[] = [
  { name: 'no parameter', query: '', values: {} },
  {
    name: 'a filter of many values and one of one value',
    query: 'status=open&status=closed&period=7',
    values: { status: ['open', 'closed'], period: ['7'] },
  },
  {
    name: 'without values that the filters do not offer, twice the same, or a second period',
    query: 'status=open&status=paused&status=open&period=7&period=1&step=abc',
    values: { status: ['open'], period: ['7'] },
  },
]

/** The parameters of an address, the values of the filters, and the query they give. */
export const filterQueryCases: {
  name: string
  query: string
  values: FilterValues
  expected: string
}[] = [
  {
    name: 'adds the values, each in a parameter',
    query: '',
    values: { status: ['open', 'closed'] },
    expected: '?status=open&status=closed',
  },
  {
    name: 'replaces the values that the address had, and keeps its other parameters',
    query: 'mock-projects=many&status=open&period=7',
    values: { period: ['1'] },
    expected: '?mock-projects=many&period=1',
  },
  { name: 'gives no query without a value', query: 'status=open', values: {}, expected: '' },
]
