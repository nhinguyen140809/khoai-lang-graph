import { viewAreas } from './view-tag.constants.js'

/**
 * The view that a file belongs to by where it sits in `src/app/`, or undefined for a file that is
 * not a page of a view.
 * @param {string} filename
 * @returns {keyof typeof viewAreas | undefined}
 */
export function viewOfFile(filename) {
  return /** @type {(keyof typeof viewAreas)[]} */ (Object.keys(viewAreas)).find((view) =>
    viewAreas[view].test(filename),
  )
}

/**
 * Whether a tag value names a view.
 * @param {string} value
 * @returns {value is keyof typeof viewAreas}
 */
export function isView(value) {
  return Object.hasOwn(viewAreas, value)
}
