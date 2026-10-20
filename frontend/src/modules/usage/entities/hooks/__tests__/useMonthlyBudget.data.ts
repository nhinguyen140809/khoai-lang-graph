/** The scenario of the page address, and the share of the budget of the month that it spends. */
export const monthlyBudgetCases = [
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
  {
    name: 'no budget while the usage fails to load',
    address: '/?mock-usage=error',
    share: undefined,
  },
]
