/** The scenario of the page address, and what the budget of the month shows: nothing at its normal level. */
export const monthlyBudgetShownCases = [
  { name: 'nothing at the normal level', address: '/', shown: null },
  { name: 'the share near its limit', address: '/?mock-budget=warning', shown: '86%' },
  { name: 'the share nearly spent', address: '/?mock-budget=danger', shown: '95%' },
]
