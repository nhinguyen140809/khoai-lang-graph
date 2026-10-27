import { positiveInteger } from '../validation'

/** Whether a record passes the filter that the address names: no such filter, or the same value. */
export function hasMatchingParam(params: URLSearchParams, name: string, value: string | null) {
  const wanted = params.get(name)
  return wanted === null || wanted === value
}

/** The path of a request, without its query. */
export function pathnameOf(request: Request): string {
  return new URL(request.url).pathname
}

/** The query parameters of a request. */
export function queryOf(request: Request): URLSearchParams {
  return new URL(request.url).searchParams
}

/** The version that `?version=` (or the parameter `name`) gives, or null when the request names none. */
export function requestedVersion(request: Request, name = 'version'): number | null {
  return positiveInteger(Number(queryOf(request).get(name))) ?? null
}
