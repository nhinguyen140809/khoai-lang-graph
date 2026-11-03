import { usageKeys } from '../usage.keys'

/** A key, and the wider key it starts with. */
export const keyCases = [
  { name: 'a month', key: usageKeys.month({}), wider: usageKeys.all() },
  {
    name: 'a grouped month',
    key: usageKeys.month({ month: '2026-09', groupBy: 'day' }),
    wider: usageKeys.all(),
  },
]

/** Two keys that must differ, so that one query never answers for the other. */
export const distinctCases = [
  {
    name: 'the current month, grouped or not',
    first: usageKeys.month({}),
    second: usageKeys.month({ groupBy: 'day' }),
  },
  {
    name: 'two months',
    first: usageKeys.month({ month: '2026-09' }),
    second: usageKeys.month({ month: '2026-10' }),
  },
]
