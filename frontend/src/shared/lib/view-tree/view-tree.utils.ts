import type { View } from '@/shared/lib/view'

// Each view has its own pages, in a folder of `src/app/` named after the view. The host of a
// request chooses the view, and the address that a person sees never names the folder: the
// address `/projects` is the page `/developer/projects` on the developer host.

/** The first label of the host that shows the developer view, as in `dev.localhost`. */
const DEVELOPER_HOST_LABEL = 'dev'

const viewTrees = ['developer', 'user'] as const satisfies readonly View[]

/** The view that a host shows: the developer view on a `dev.` host, the user view on any other. */
export function viewOfHost(host: string | null): View {
  const firstLabel = (host ?? '').split('.', 1)[0]
  return firstLabel === DEVELOPER_HOST_LABEL ? 'developer' : 'user'
}

/** The page of a view that an address names: `/projects` is `/developer/projects`. */
export function treePathOf(view: View, address: string): string {
  return address === '/' ? `/${view}` : `/${view}${address}`
}

/** Whether a path starts with the folder of a view, which no address that a person sees does. */
export function isTreePath(path: string): boolean {
  return viewTrees.some((tree) => path === `/${tree}` || path.startsWith(`/${tree}/`))
}

/** The address of a page of a view, given its path without a query: `/developer/projects` is `/projects`. */
export function addressOfTreePath(path: string): string {
  if (!isTreePath(path)) return path
  const address = path.slice(path.indexOf('/', 1))
  return address.startsWith('/') ? address : '/'
}
