// The views of the app, and the tag that marks what belongs to one of them. A component, a hook or
// a type is marked where it is declared: `@view user` in its doc comment says that only the pages of
// the user view place it, `@view developer` that only the pages of the developer view do. What has
// no tag is shared. The rule that reads the tag is `local/view-boundary`.

/** The name of the tag in a doc comment. */
export const viewTag = 'view'

/** The views, each with the folder of `src/app/` whose pages belong to it. */
export const viewAreas = /** @type {const} */ ({
  user: /[\\/]src[\\/]app[\\/]user[\\/]/,
  developer: /[\\/]src[\\/]app[\\/]developer[\\/]/,
})
