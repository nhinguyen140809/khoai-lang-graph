const percentFormat = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 })

/** A share in percent, such as 86 for 86 percent, to the nearest whole percent: "86%". */
export function formatPercent(percent: number): string {
  return percentFormat.format(percent / 100)
}
