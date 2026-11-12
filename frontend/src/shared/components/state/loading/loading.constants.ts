import type { StateSize } from '../state.types'

/** Columns of a grid or a table when the caller sets none. */
export const defaultColumns = 3

/** Pixels in one step of the spacing scale. */
export const stepPx = 4

// Fixed widths, cycled per row: random widths would differ between server and client render.
export const rowWidths = ['w-4/5', 'w-3/5', 'w-2/3']

/** The padding around a layout in each size: its classes, and its pixels on top and below together. */
export const sizePadding = {
  compact: { className: 'px-2 py-1', verticalPx: 8 },
  page: { className: 'p-6', verticalPx: 48 },
} as const satisfies Record<StateSize, { className: string; verticalPx: number }>

/** The padding of a layout that starts at the edge of its container. */
export const flushPadding = { className: 'p-0', verticalPx: 0 } as const
