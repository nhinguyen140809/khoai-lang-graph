/**
 * The items in a map by their key, one item for each key: `valueOf` tells what of the item the map
 * holds, the item itself by default. When two items share a key, the later one holds it. The keys
 * keep the order the items came in.
 */
export function indexBy<T, K>(items: Iterable<T>, keyOf: (item: T) => K): Map<K, T>
export function indexBy<T, K, V>(
  items: Iterable<T>,
  keyOf: (item: T) => K,
  valueOf: (item: T) => V,
): Map<K, V>
export function indexBy<T, K, V>(
  items: Iterable<T>,
  keyOf: (item: T) => K,
  valueOf?: (item: T) => V,
): Map<K, T | V> {
  const byKey = new Map<K, T | V>()
  for (const item of items) {
    byKey.set(keyOf(item), valueOf === undefined ? item : valueOf(item))
  }
  return byKey
}
