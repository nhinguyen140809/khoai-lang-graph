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
