/**
 * `compact` fits narrow containers such as the sidebar. `page` fills the container it is in and
 * puts the state in the middle of it, horizontally and vertically.
 */
export type StateSize = 'compact' | 'page'

/** The container of a state in the `page` size: it fills its parent and centers its content. */
export const pageClassName = 'flex h-full min-h-48 w-full items-center justify-center p-6'
