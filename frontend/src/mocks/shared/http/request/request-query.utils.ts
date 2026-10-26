import { positiveInteger } from '../validation/field-values.utils'

/** Whether a record passes the filter that the address names: no such filter, or the same value. */
export function hasMatchingParam(params: URLSearchParams, name: string, value: string | null) {
  const wanted = params.get(name)
  return wanted === null || wanted === value
}

/** The version that `?version=` names, or null when the request names none. */
export function requestedVersion(request: Request): number | null {
  return positiveInteger(Number(new URL(request.url).searchParams.get('version'))) ?? null
}
