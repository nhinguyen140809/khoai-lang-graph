/**
 * The two arrangements of the desk of the user view. `library` keeps the list of projects in a side
 * list at the left and the tools of a project in the bar at the top; `studio` leaves the page to the
 * chat, with the tools of a project in a rail at the right that opens a panel when needed.
 */
export const deskLayouts = ['library', 'studio'] as const

export type DeskLayout = (typeof deskLayouts)[number]

/** A value for each arrangement of the desk; a new arrangement needs an entry, which the type requires. */
export type ByDeskLayout<T> = Record<DeskLayout, T>
