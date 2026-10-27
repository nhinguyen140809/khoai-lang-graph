import type { FilterAction, FilterField, FilterValues } from '../filter.types'

const statuses: FilterField = {
  key: 'status',
  label: 'Status',
  choose: 'many',
  options: [
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
  ],
}

const period: FilterField = {
  key: 'period',
  label: 'Period',
  choose: 'one',
  options: [
    { value: '1', label: 'In the last day' },
    { value: '7', label: 'In the last 7 days' },
  ],
}

/** Values, a change, and the values after it. */
export const actionCases: {
  name: string
  values: FilterValues
  action: FilterAction
  next: FilterValues
}[] = [
  {
    name: 'adds a value to a filter of many values',
    values: { status: ['open'] },
    action: { type: 'toggle', field: statuses, value: 'closed' },
    next: { status: ['open', 'closed'] },
  },
  {
    name: 'removes a value chosen before',
    values: { status: ['open', 'closed'] },
    action: { type: 'toggle', field: statuses, value: 'open' },
    next: { status: ['closed'] },
  },
  {
    name: 'replaces the value of a filter of one value',
    values: { period: ['1'], status: ['open'] },
    action: { type: 'toggle', field: period, value: '7' },
    next: { period: ['7'], status: ['open'] },
  },
  {
    name: 'removes the value of a filter of one value',
    values: { period: ['7'] },
    action: { type: 'toggle', field: period, value: '7' },
    next: { period: [] },
  },
  {
    name: 'replaces every value',
    values: { status: ['open'] },
    action: { type: 'set', values: { period: ['1'] } },
    next: { period: ['1'] },
  },
  {
    name: 'removes every value',
    values: { status: ['open'], period: ['1'] },
    action: { type: 'clear' },
    next: {},
  },
]

/** The filters of the tests of the form. */
export const testFields = [statuses, period]
