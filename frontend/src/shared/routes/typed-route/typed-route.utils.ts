import type { Route } from 'next'

/**
 * The address, checked against the pages of the app as `Link` checks its `href`: a path that no
 * folder of `src/app/` has is a type error.
 */
export function checkedRoute<T extends string>(href: Route<T>): Route {
  return href as Route
}

/** The query of an address, from the parameters given; empty when none is. */
export function search(params: Readonly<Record<string, string | undefined>>): '' | `?${string}` {
  const query = new URLSearchParams()
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined) query.set(name, value)
  }
  const text = query.toString()
  return text === '' ? '' : `?${text}`
}
