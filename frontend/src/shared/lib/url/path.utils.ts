import type { QueryValue } from './query-string.types'
import { queryString } from './query-string.utils'

/** The path of an address, without its query and its fragment. */
export function pathOf(href: string): string {
  return href.split(/[?#]/)[0] ?? href
}

/** Encodes an identifier for use as one URL path segment. */
export const encodeId = encodeURIComponent

/** Whether a page is at a path or under it: `/projects` holds `/projects/p1`, not `/projectsx`. */
export function isAtOrUnder(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`)
}

/**
 * A path with the query of the parameters given, `/items?kind=a&version=2`; a parameter without a
 * value is left out, and the path is unchanged when none has one.
 */
export function pathWithQuery(path: string, params: Readonly<Record<string, QueryValue>>): string {
  return `${path}${queryString(params)}`
}
