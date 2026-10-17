import type { StateSize } from '../state.types'

/** The placeholder asked for, and the skeletons it shows. */
export const loadingCases: { name: string; size: StateSize; rows: number; skeletons: number }[] = [
  { name: 'rows in the middle of a page', size: 'page', rows: 3, skeletons: 3 },
  { name: 'rows in a narrow container', size: 'compact', rows: 2, skeletons: 2 },
]
