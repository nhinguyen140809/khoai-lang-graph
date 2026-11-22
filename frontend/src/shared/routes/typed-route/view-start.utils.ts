import type { View } from '@/shared/lib/view'
import { hostOfView } from '@/shared/routes/hosts'

/**
 * The address of the start page of a view, given the host of the request. Each view is shown by
 * its own host, so the address names the host and leaves the scheme out: it keeps the scheme and
 * the port of the page it is on. Without a host it is the start page of the view on show.
 */
export function viewStartHref(view: View, host: string | null): string {
  return host === null ? '/' : `//${hostOfView(view, host)}/`
}
