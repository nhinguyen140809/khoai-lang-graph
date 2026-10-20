/**
 * The two views of the app. The user view speaks the words of the user and leaves out the words
 * of the system; the developer view shows the system as it is, in its own words.
 */
export const views = ['user', 'developer'] as const

export type View = (typeof views)[number]

/** How one value of the system reads in each view, such as a status of a run. */
export type Wording = Record<View, string>
