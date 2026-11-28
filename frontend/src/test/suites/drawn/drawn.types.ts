import type { MotionValue } from 'motion/react'
import type { ComponentType } from 'react'

/** A thing a clock draws, by the name its test calls it, as the suites of the drawn things take it. */
export type DrawnThing = readonly [string, ComponentType<{ progress: MotionValue<number> }>]
