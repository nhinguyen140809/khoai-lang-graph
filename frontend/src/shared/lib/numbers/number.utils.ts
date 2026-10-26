import type { NumberLimits } from './number.types'

// The most decimals that a rounding keeps; `toFixed` takes up to 100, and no step needs this many.
const MAX_DECIMALS = 20

/** The value held between the limits of `limits`. */
export function clamp(value: number, { min, max }: NumberLimits = {}): number {
  const atLeast = min === undefined ? value : Math.max(value, min)
  return max === undefined ? atLeast : Math.min(atLeast, max)
}

/** How many digits a number has after the decimal point: 0.25 has 2. */
export function decimalsOf(value: number): number {
  const [mantissa = '', exponent] = value.toString().split('e')
  const written = mantissa.split('.')[1]?.length ?? 0
  return Math.min(Math.max(written - Number(exponent ?? 0), 0), MAX_DECIMALS)
}
