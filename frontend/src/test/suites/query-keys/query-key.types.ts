/** A query key, and the wider key of the same factory that it starts with. */
export interface NestedQueryKeyCase {
  name: string
  key: readonly unknown[]
  wider: readonly unknown[]
}

/** Two query keys that must differ, so that one query never answers for the other. */
export interface DistinctQueryKeysCase {
  name: string
  first: readonly unknown[]
  second: readonly unknown[]
}
