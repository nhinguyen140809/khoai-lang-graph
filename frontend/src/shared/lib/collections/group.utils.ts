/**
 * The items grouped by the key that `keyOf` gives them, in the order the keys first appear; the
 * items of a group keep their order. No item gives no group.
 */
export function groupBy<T, K>(
  items: readonly T[],
  keyOf: (item: T) => K,
): { key: K; items: T[] }[] {
  const groups: { key: K; items: T[] }[] = []
  for (const item of items) {
    const key = keyOf(item)
    const group = groups.find((candidate) => Object.is(candidate.key, key))
    if (group === undefined) groups.push({ key, items: [item] })
    else group.items.push(item)
  }
  return groups
}

/**
 * The item of each group that ranks highest, by the key of its group, such as the newest message
 * of each thread. Of two items of one rank, the first one stays; the groups keep the order in which
 * their first item came.
 */
export function newestOfEachGroup<T, K>(
  items: Iterable<T>,
  groupOf: (item: T) => K,
  rankOf: (item: T) => number,
): Map<K, T> {
  const newest = new Map<K, T>()
  for (const item of items) {
    const group = groupOf(item)
    const known = newest.get(group)
    if (known === undefined || rankOf(item) > rankOf(known)) newest.set(group, item)
  }
  return newest
}

/**
 * The items of each key, in a map: every item goes to the array of the key that `keyOf` gives
 * it, `valueOf` tells what of the item its array holds, and a null key skips the item. The keys
 * and the items of each array keep the order they came in.
 */
export function collectBy<T, K>(items: Iterable<T>, keyOf: (item: T) => K | null): Map<K, T[]>
export function collectBy<T, K, V>(
  items: Iterable<T>,
  keyOf: (item: T) => K | null,
  valueOf: (item: T) => V,
): Map<K, V[]>
export function collectBy<T, K, V>(
  items: Iterable<T>,
  keyOf: (item: T) => K | null,
  valueOf?: (item: T) => V,
): Map<K, V[]> {
  const ofKey = new Map<K, V[]>()
  for (const item of items) {
    const key = keyOf(item)
    if (key === null) continue
    const value = valueOf === undefined ? (item as unknown as V) : valueOf(item)
    const held = ofKey.get(key)
    if (held === undefined) ofKey.set(key, [value])
    else held.push(value)
  }
  return ofKey
}
