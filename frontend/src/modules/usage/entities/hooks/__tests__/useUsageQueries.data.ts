import type { CostShare } from '@/shared/lib/cost'

/** The scenario of the page address, and the share of the budget of the month that it spends. */
export const monthlyBudgetCases: {
  name: string
  address: string
  share: Partial<CostShare> | undefined
}[] = [
  { name: 'a budget at its normal level', address: '/', share: { percent: 23, level: 'normal' } },
  {
    name: 'a budget near its limit',
    address: '/?mock-budget=warning',
    share: { percent: 86, level: 'warning' },
  },
  {
    name: 'a budget nearly spent',
    address: '/?mock-budget=danger',
    share: { percent: 95, level: 'danger' },
  },
  { name: 'nothing without a budget', address: '/?mock-budget=none', share: undefined },
  { name: 'nothing when the usage fails to load', address: '/?mock-usage=error', share: undefined },
]
