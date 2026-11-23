import { type View, views } from '@/shared/lib/view'

// Each view has its own pages, in a folder of `src/app/` named after the view. The host of a
// request chooses the view, and the address that a person sees never names the folder: the
// address `/projects` is the page `/developer/projects` on the developer host.

/**
 * The first label of the host that shows each view, as in `dev.localhost`. The view with no label
 * is the one that a host without a known label shows, so exactly one view has none. A new view
 * needs a label here, which the type requires.
 */
const viewHostLabels: Record<View, string | null> = {
  developer: 'dev',
  user: null,
}

const labelledViews = views.filter((view) => viewHostLabels[view] !== null)
const defaultView = views.find((view) => viewHostLabels[view] === null) ?? views[0]

/** The first label of a host, which is the one that names a view. */
function firstLabelOf(host: string): string {
  return host.split('.', 1)[0] ?? ''
}

/** The view that a host shows: the view of its first label, and the view with no label otherwise. */
export function viewOfHost(host: string | null): View {
  const firstLabel = firstLabelOf(host ?? '')
  return labelledViews.find((view) => viewHostLabels[view] === firstLabel) ?? defaultView
}

/**
 * The host that shows a view, given the host of the request: the label of the view replaces the
 * label of the view that the host shows now, and a view with no label has none. The port stays, so
 * `localhost:3000` and `dev.localhost:3000` lead to each other.
 */
export function hostOfView(view: View, host: string): string {
  const shown = viewOfHost(host)
  const base = viewHostLabels[shown] === null ? host : host.slice(firstLabelOf(host).length + 1)
  const label = viewHostLabels[view]
  return label === null ? base : `${label}.${base}`
}

/** The page of a view that an address names: `/projects` is `/developer/projects`. */
export function areaPathOf(view: View, address: string): string {
  return address === '/' ? `/${view}` : `/${view}${address}`
}

/** Whether a path starts with the folder of a view, which no address that a person sees does. */
export function isAreaPath(path: string): boolean {
  return views.some((area) => path === `/${area}` || path.startsWith(`/${area}/`))
}

/** The address of a page of a view, given its path without a query: `/developer/projects` is `/projects`. */
export function addressOfAreaPath(path: string): string {
  if (!isAreaPath(path)) return path
  const address = path.slice(path.indexOf('/', 1))
  return address.startsWith('/') ? address : '/'
}
