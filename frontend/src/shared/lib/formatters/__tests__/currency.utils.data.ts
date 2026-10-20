/** An amount in USD, and how it reads. */
export const formatUsdCases = [
  { amount: 1.72, text: '$1.72' },
  { amount: 2, text: '$2.00' },
  { amount: 0, text: '$0.00' },
  { amount: 1.796, text: '$1.80' },
  // Below half a cent as stored, but half a cent once multiplied, as `costPercent` reads it.
  { amount: 1.115, text: '$1.12' },
]
