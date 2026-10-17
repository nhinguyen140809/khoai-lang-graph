import type { FilterField, FilterValues } from './filter.types'

/** How many filters have a value, which the button that opens the filters shows. */
export function activeFilterCount(values: FilterValues): number {
  return Object.values(values).filter((chosen) => chosen !== undefined && chosen.length > 0).length
}

/**
 * The values of the filters in the parameters of an address: a parameter for each filter, named by
 * its key and given once for each value. A value that the filter does not offer is left out, and a
 * filter of one value keeps the first.
 */
export function filterValuesOf(
  params: URLSearchParams,
  fields: readonly FilterField[],
): FilterValues {
  const values: Record<string, readonly string[]> = {}
  for (const field of fields) {
    const offered = new Set(field.options.map(({ value }) => value))
    const chosen = [...new Set(params.getAll(field.key))].filter((value) => offered.has(value))
    if (chosen.length > 0) values[field.key] = field.choose === 'one' ? chosen.slice(0, 1) : chosen
  }
  return values
}

/**
 * The query of an address with the values of the filters in place of those it has, which keeps
 * its other parameters; empty when it has none.
 */
export function filterSearch(
  params: URLSearchParams,
  fields: readonly FilterField[],
  values: FilterValues,
): '' | `?${string}` {
  const next = new URLSearchParams(params)
  for (const field of fields) {
    next.delete(field.key)
    for (const value of values[field.key] ?? []) next.append(field.key, value)
  }
  const text = next.toString()
  return text === '' ? '' : `?${text}`
}
