import { isString } from '@/shared/lib/guards'

import { RouteParam } from './route-params.constants'

/** The page to return to, read from the query of a login or account page. */
export function nextParam(query: Record<string, string | string[] | undefined>): string | null {
  const value = query[RouteParam.Next]
  return isString(value) ? value : null
}
