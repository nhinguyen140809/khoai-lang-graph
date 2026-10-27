import type { FilterAction, FilterField, FilterValues } from './filter.types'

/** The values of a list that no filter narrows: the values before any change. */
export const noFilters: FilterValues = {}

// The values with `value` of `field` chosen, or no longer chosen when it was. A filter that keeps
// one value replaces the one chosen before.
function toggleValue(values: FilterValues, field: FilterField, value: string): FilterValues {
  const chosen = values[field.key] ?? []
  if (chosen.includes(value)) {
    return { ...values, [field.key]: chosen.filter((other) => other !== value) }
  }
  return { ...values, [field.key]: field.choose === 'one' ? [value] : [...chosen, value] }
}

/** The values of the filters after a change, for `useReducer`. */
export function applyFilterAction(values: FilterValues, action: FilterAction): FilterValues {
  switch (action.type) {
    case 'toggle':
      return toggleValue(values, action.field, action.value)
    case 'set':
      return action.values
    case 'clear':
      return noFilters
  }
}
