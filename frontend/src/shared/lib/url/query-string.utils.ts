import type { QueryValue } from './query-string.types'

/** The query of an address from its parameters; empty when it has none. */
export function queryStringOf(query: URLSearchParams): '' | `?${string}` {
  const text = query.toString()
  return text === '' ? '' : `?${text}`
}

/**
 * The query of an address or a request from the parameters given, `?kind=a&version=2`; a parameter
 * without a value is left out, and the query is empty when none has one. A list gives the parameter
 * once for each entry, `?status=a&status=b`, and an empty list leaves it out.
 */
export function queryString(params: Readonly<Record<string, QueryValue>>): '' | `?${string}` {
  const query = new URLSearchParams()
  for (const [name, value] of Object.entries(params)) {
    if (value === undefined) continue
    if (typeof value === 'object') {
      for (const entry of value) query.append(name, entry)
    } else {
      query.set(name, String(value))
    }
  }
  return queryStringOf(query)
}
