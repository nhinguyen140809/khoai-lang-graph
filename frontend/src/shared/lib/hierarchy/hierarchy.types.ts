/** How to read the place of an item in a hierarchy: its own id, and the id of the item it sits under. */
export interface Hierarchy<T> {
  idOf: (item: T) => string
  parentIdOf: (item: T) => string | null
}

/** An item with the items inside it, at any depth, as its `children`. */
export type Nested<T> = T & { children: Nested<T>[] }
