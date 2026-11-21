/**
 * The items that components register while they are mounted, such as the items of the status bar.
 * Each component registers under an id of its own, so that its item leaves with it.
 */
export interface RegistryState<Item> {
  /** The item of each component that registers one, in the order the components came. */
  items: ReadonlyMap<string, Item>
  setItem: (source: string, item: Item) => void
  removeItem: (source: string) => void
}

/** The hook of the store of a registry, as `create` of zustand gives it: it reads from the state. */
export type RegistryStore<Item> = <T>(select: (state: RegistryState<Item>) => T) => T

/** An item that sits among the others by its order. */
export interface OrderedItem {
  /** From the lowest to the highest; two items of the same order keep the order in which they came. */
  order?: number | undefined
}

/** What a reader of a registry asks of its items, beyond their order. */
export interface RegisteredItemsOptions<Item> {
  /**
   * Keeps only the items that every filter accepts, such as those of one side of a bar. A new list
   * lists the items again, so keep it a constant of the module, or in `useMemo`.
   */
  filters?: readonly ((item: Item) => boolean)[] | undefined
}
