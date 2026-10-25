import type { NumberLimits } from '@/shared/lib/numbers'

/** What a text may hold to be a number: a negative sign, and decimals. */
export interface NumberTextOptions {
  /** Whether a negative sign is allowed. */
  signed: boolean
  /** Whether the number is whole: the text stops at a decimal point. */
  integer: boolean
}

/** A step of a number up or down. */
export interface NumberStep extends NumberLimits {
  direction: 1 | -1
  /** The size of one step. */
  step: number
  /** How many steps at once, such as 10 for a step with Shift held. */
  times?: number
}

/** What a key does in a number field: steps the number, or goes to one of its limits. */
export type NumberKeyAction =
  { kind: 'step'; direction: 1 | -1; times: number } | { kind: 'limit'; edge: 'min' | 'max' }
