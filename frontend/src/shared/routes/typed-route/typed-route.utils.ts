import type { Route } from 'next'

/**
 * The address, checked against the pages of the app as `Link` checks its `href`: a path that no
 * folder of `src/app/` has is a type error.
 */
export function checkedRoute<T extends string>(href: Route<T>): Route {
  return href as Route
}

/**
 * An address that comes from data, such as a path in the address bar or a stored tab, as the type
 * of the addresses of the pages. The route types cannot check it: what it names is not known until
 * the app runs. Use `checkedRoute` for an address written in the code.
 */
export function routeOfAddress(address: string): Route {
  return address as Route
}
