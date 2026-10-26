/** A number, and how it reads with its thousands separated. */
export const numberCases = [
  { name: 'a whole number', value: 12, text: '12' },
  { name: 'thousands', value: 12_345, text: '12,345' },
  { name: 'millions', value: 1_234_567, text: '1,234,567' },
  { name: 'decimals, cut to two', value: 12.3456, text: '12.35' },
  { name: 'zero', value: 0, text: '0' },
  { name: 'a negative number', value: -1500, text: '-1,500' },
] as const

/** A ratio, the digits asked for, and how it reads. */
export const percentCases = [
  { name: 'a ratio without digits', ratio: 0.256, digits: undefined, text: '26%' },
  { name: 'a ratio with one digit', ratio: 0.256, digits: 1, text: '25.6%' },
  { name: 'zero', ratio: 0, digits: undefined, text: '0%' },
  { name: 'the whole', ratio: 1, digits: undefined, text: '100%' },
  { name: 'more than the whole', ratio: 1.25, digits: undefined, text: '125%' },
] as const

/** An amount, the currency asked for, and how it reads. */
export const currencyCases = [
  { name: 'dollars and cents', value: 1.72, currency: undefined, text: '$1.72' },
  { name: 'a round amount', value: 2, currency: undefined, text: '$2.00' },
  { name: 'thousands', value: 1234.5, currency: undefined, text: '$1,234.50' },
  { name: 'zero', value: 0, currency: undefined, text: '$0.00' },
  { name: 'exactly one cent', value: 0.01, currency: undefined, text: '$0.01' },
  { name: 'less than a cent', value: 0.0042, currency: undefined, text: '$0.0042' },
  {
    name: 'less than a cent, rounded to four digits',
    value: 0.00004,
    currency: undefined,
    text: '$0.0000',
  },
  { name: 'a negative amount', value: -1.5, currency: undefined, text: '-$1.50' },
  { name: 'another currency', value: 1.5, currency: 'EUR', text: '€1.50' },
] as const
