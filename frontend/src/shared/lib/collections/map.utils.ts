/** A copy of the map with `value` set for `key`; a key that is there already keeps its place. */
export function setEntry<K, V>(map: ReadonlyMap<K, V>, key: K, value: V): Map<K, V> {
  return new Map(map).set(key, value)
}

/** A copy of the map without `key`. */
export function removeEntry<K, V>(map: ReadonlyMap<K, V>, key: K): Map<K, V> {
  const next = new Map(map)
  next.delete(key)
  return next
}
