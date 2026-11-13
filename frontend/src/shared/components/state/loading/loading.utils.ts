import type { CSSProperties } from 'react'

import { stepPx } from './loading.constants'
import type { LoadingFit, LoadingMeasure } from './loading.types'

/** A length of `steps` steps of the spacing scale, such as 4 for 1rem. */
export function spacing(steps: number): string {
  return `calc(var(--spacing) * ${String(steps)})`
}

export const heightOf = (steps: number): CSSProperties => ({ height: spacing(steps) })

export const items = (count: number) => Array.from({ length: count }, (_, index) => index)

/**
 * The fit of a layout that adds rows: as many rows of `unitPx` pixels, with the gap between them,
 * as the height holds, and at least one. The items keep their height.
 */
export function addRows(unitPx: (measure: LoadingMeasure) => number) {
  return (available: number, measure: LoadingMeasure): LoadingFit => {
    const gapPx = measure.gap * stepPx
    const rows = Math.floor((available + gapPx) / (unitPx(measure) + gapPx))
    return { rows: Math.max(1, rows), itemHeight: measure.itemHeight }
  }
}

/**
 * The fit of a layout that keeps its rows and makes its items taller: the height left after
 * `fixedPx` of everything that does not stretch is shared by the `rows` items, none of them
 * shorter than the height asked for.
 */
export function stretchItems(fixedPx: (measure: LoadingMeasure, rows: number) => number) {
  return (available: number, measure: LoadingMeasure, rows: number): LoadingFit => {
    const share = (available - fixedPx(measure, rows)) / Math.max(1, rows) / stepPx
    return { rows, itemHeight: Math.max(measure.itemHeight, Math.floor(share)) }
  }
}
