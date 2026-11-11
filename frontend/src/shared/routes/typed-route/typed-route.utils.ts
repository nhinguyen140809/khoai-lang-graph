import type { Route } from 'next'

import { addressOfTreePath } from '@/shared/lib/view-tree'

/**
 * The address of a page, given the path of the page as its folders of `src/app/` write it, with
 * the folder of its view: `/developer/projects` gives `/projects`. The path is checked against the
 * pages of the app as `Link` checks its `href`, so a path that no folder has is a type error. The
 * address leaves the folder of the view out, since the host of the page chooses the view.
 */
export function checkedRoute<T extends string>(page: Route<T>): Route {
  return addressOfTreePath(page) as Route
}

/**
 * An address that comes from data, such as a path in the address bar or a stored tab, as the type
 * of the addresses of the pages. The route types cannot check it: what it names is not known until
 * the app runs. Use `checkedRoute` for an address written in the code.
 */
export function routeOfAddress(address: string): Route {
  return address as Route
}
