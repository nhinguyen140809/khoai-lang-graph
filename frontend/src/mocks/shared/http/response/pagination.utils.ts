import { queryOf } from '../request'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

/**
 * One page of `items` in the list envelope of the API, read from `?limit=` and `?cursor=`. The
 * cursor is the offset of the next page; clients treat it as opaque.
 */
export function paginate<T>(
  items: T[],
  request: Request,
): { items: T[]; next_cursor: string | null } {
  const params = queryOf(request)
  const limit = Math.min(Number(params.get('limit')) || DEFAULT_LIMIT, MAX_LIMIT)
  const offset = Number(params.get('cursor')) || 0
  const end = offset + limit
  return { items: items.slice(offset, end), next_cursor: end < items.length ? String(end) : null }
}

/** The list envelope of the API without items. */
export const emptyPage = { items: [], next_cursor: null }
