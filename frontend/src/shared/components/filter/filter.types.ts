/** One value that a filter can take, such as a status. */
export interface FilterOption {
  value: string
  label: string
}

/** A filter of a list: what it filters the items by, and the values to choose from. */
export interface FilterField {
  /** The key of the filter in the values, such as `runStatus`. */
  key: string
  label: string
  /** `one` keeps one value at most, such as a period; `many` keeps any number, such as statuses. */
  choose: 'one' | 'many'
  options: readonly FilterOption[]
}

/** The values chosen for each filter, by its key; a filter without a value does not filter. */
export type FilterValues = Readonly<Partial<Record<string, readonly string[]>>>

/**
 * A change of the values of the filters: `toggle` chooses a value of a filter, or no longer
 * chooses it; `set` replaces every value; `clear` removes them all.
 */
export type FilterAction =
  | { type: 'toggle'; field: FilterField; value: string }
  | { type: 'set'; values: FilterValues }
  | { type: 'clear' }
