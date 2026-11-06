import { formatLocale } from '@/shared/config/locale'
import { hasText } from '@/shared/lib/guards'
import { clamp, decimalsOf, type NumberLimits } from '@/shared/lib/numbers'

import type { NumberKeyAction, NumberStep, NumberTextOptions } from './number-input.types'

// How many steps a key or a button with Shift held takes at once.
const LARGE_STEP_TIMES = 10

/** How many steps one press takes: one, or ten with Shift held. */
export function stepTimesOf(isShiftHeld: boolean): number {
  return isShiftHeld ? LARGE_STEP_TIMES : 1
}

/**
 * What a key does in a number field: Up and Down step, with Shift or with Page Up and Page Down ten
 * steps at once, Home and End go to the limits. Null for any other key.
 */
export function keyAction(key: string, isShiftHeld: boolean): NumberKeyAction | null {
  switch (key) {
    case 'ArrowUp':
      return { kind: 'step', direction: 1, times: stepTimesOf(isShiftHeld) }
    case 'ArrowDown':
      return { kind: 'step', direction: -1, times: stepTimesOf(isShiftHeld) }
    case 'PageUp':
      return { kind: 'step', direction: 1, times: LARGE_STEP_TIMES }
    case 'PageDown':
      return { kind: 'step', direction: -1, times: LARGE_STEP_TIMES }
    case 'Home':
      return { kind: 'limit', edge: 'min' }
    case 'End':
      return { kind: 'limit', edge: 'max' }
    default:
      return null
  }
}

/** Whether a step in `direction` can move the number: an empty value always can. */
export function canStep(
  value: number | null,
  direction: 1 | -1,
  { min, max }: NumberLimits,
): boolean {
  if (value === null) return true
  return direction === 1 ? max === undefined || value < max : min === undefined || value > min
}

/**
 * The number one step from `value`, kept between the limits. An empty value starts at the nearest
 * limit to zero instead, so that the first press shows the point where the steps begin. The sum is
 * rounded to the decimals of the step and of the value, so that 0.1 + 0.2 is 0.3.
 */
export function stepNumber(
  value: number | null,
  { direction, step, times = 1, min, max }: NumberStep,
): number {
  if (value === null) return clamp(0, { min, max })
  const decimals = Math.max(decimalsOf(step), decimalsOf(value))
  const next = Number((value + direction * step * times).toFixed(decimals))
  // A sum that rounds to a negative zero is zero.
  return clamp(next === 0 ? 0 : next, { min, max })
}

/**
 * What a user may type in a number field: digits, one decimal point unless the number is whole,
 * and a negative sign at the start when it is allowed. Anything else, such as letters, spaces and
 * the thousands separators of a pasted text, is dropped.
 */
export function sanitizeNumberText(text: string, { signed, integer }: NumberTextOptions): string {
  const isNegative = signed && text.trimStart().startsWith('-')
  const [whole = '', ...decimals] = text.replace(/[^\d.]/g, '').split('.')
  const kept = integer || decimals.length === 0 ? whole : `${whole}.${decimals.join('')}`
  return isNegative ? `-${kept}` : kept
}

/** The number a text holds, or null when it holds none yet, such as "", "-" or ".". */
export function numberFromText(text: string): number | null {
  if (!hasText(text)) return null
  const value = Number(text)
  if (!Number.isFinite(value)) return null
  return value === 0 ? 0 : value
}

/** The text of a number as typed, with no exponent: 0.0000001 as "0.0000001". */
export function numberToText(value: number | null): string {
  if (value === null) return ''
  // `toString` writes a very small or a very large number with an exponent, which a user cannot
  // edit; `toLocaleString` writes every digit.
  return value.toLocaleString(formatLocale, { useGrouping: false, maximumFractionDigits: 20 })
}
