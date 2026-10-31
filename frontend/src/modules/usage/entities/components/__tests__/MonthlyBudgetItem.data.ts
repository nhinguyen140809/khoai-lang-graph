/** The scenario of the page address, and what the budget of the month shows: nothing at its normal level. */
export const monthlyBudgetShownCases: {
  name: string
  address: string
  shown: { percent: string; amounts: string } | null
}[] = [
  { name: 'nothing at the normal level', address: '/', shown: null },
  { name: 'nothing without usage', address: '/?mock-usage=empty', shown: null },
  { name: 'nothing without a budget', address: '/?mock-budget=none', shown: null },
  {
    name: 'the meter near its limit',
    address: '/?mock-budget=warning',
    shown: { percent: '86%', amounts: '$4.76 / $5.52' },
  },
  {
    name: 'the meter nearly spent',
    address: '/?mock-budget=danger',
    shown: { percent: '95%', amounts: '$4.76 / $5.00' },
  },
]
