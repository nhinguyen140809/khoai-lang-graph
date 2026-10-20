/** An amount in USD, to the nearest cent, rounded as `costPercent` rounds it: "$1.72". */
export function formatUsd(amount: number): string {
  return `$${(Math.round(amount * 100) / 100).toFixed(2)}`
}
