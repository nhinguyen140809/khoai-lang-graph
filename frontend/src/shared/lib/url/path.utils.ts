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
