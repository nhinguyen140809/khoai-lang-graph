/** A copy of the record without the entries of the given keys. */
export function omit<T extends object, K extends keyof T>(
  record: T,
  keys: Iterable<K>,
): Omit<T, K> {
  const dropped = new Set<PropertyKey>(keys)
  return Object.fromEntries(Object.entries(record).filter(([key]) => !dropped.has(key))) as Omit<
    T,
    K
  >
}
