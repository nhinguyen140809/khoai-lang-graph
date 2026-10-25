/** A value, the limits, and the value held between them. */
export const clampCases = [
  { name: 'a value inside the limits', value: 5, limits: { min: 0, max: 10 }, expected: 5 },
  { name: 'a value under the minimum', value: -1, limits: { min: 0, max: 10 }, expected: 0 },
  { name: 'a value over the maximum', value: 11, limits: { min: 0, max: 10 }, expected: 10 },
  { name: 'a value on a limit', value: 10, limits: { min: 0, max: 10 }, expected: 10 },
  { name: 'a minimum only', value: -5, limits: { min: 0 }, expected: 0 },
  { name: 'a maximum only', value: 50, limits: { max: 10 }, expected: 10 },
  { name: 'no limit', value: -1e9, limits: {}, expected: -1e9 },
] as const

/** A number, and how many digits it has after the decimal point. */
export const decimalsCases = [
  { name: 'a whole number', value: 12, expected: 0 },
  { name: 'one decimal', value: 0.5, expected: 1 },
  { name: 'two decimals', value: 12.25, expected: 2 },
  { name: 'a negative number', value: -0.125, expected: 3 },
  { name: 'a number written with an exponent', value: 1e-7, expected: 7 },
  { name: 'a large number', value: 1e21, expected: 0 },
] as const
