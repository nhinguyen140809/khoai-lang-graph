import type { views } from './view.constants'

export type View = (typeof views)[number]

/** How one value of the system reads in each view, such as a status of a run. */
export type Wording = Record<View, string>
