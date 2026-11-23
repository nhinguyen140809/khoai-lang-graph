'use client'

import { type MotionValue, useTransform } from 'motion/react'

/** The sum of two values that change over time. */
export function useSum(
  first: MotionValue<number>,
  second: MotionValue<number>,
): MotionValue<number> {
  return useTransform<number, number>([first, second], ([a, b]) => (a ?? 0) + (b ?? 0))
}
