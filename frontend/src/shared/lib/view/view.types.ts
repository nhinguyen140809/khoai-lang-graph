/**
 * The two views of the app. The developer view shows the system as it is, in its own words; the
 * user view speaks the words of the user and leaves out the words of the system.
 */
export const views = ['user', 'developer'] as const

export type View = (typeof views)[number]

/**
 * A value in each view. The user view reads the value of the developer view until it has its
 * own, so a value that both views share is written once.
 */
export interface ByView<T> {
  developer: T
  user?: T
}

/** How one value of the system reads in each view, such as a status of a run. */
export type Wording = ByView<string>
