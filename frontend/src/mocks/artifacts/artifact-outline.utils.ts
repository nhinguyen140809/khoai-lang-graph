import { type ArtifactItem } from '@/modules/artifact/entities'

import type { PlacedItem } from './artifacts.types'

/**
 * The items of one artifact in outline order: a parent, then what it contains, the children of a
 * parent by position. Each item gets the outline number of its place, such as `3.2.1`, or `1`, `2` when no
 * item has a parent. An item whose parent is not among the items counts as top level.
 */
export function placeInOutline(items: ArtifactItem[]): PlacedItem[] {
  const ids = new Set(items.map(({ id }) => id))
  const parentOf = ({ parent_item_id }: ArtifactItem) =>
    parent_item_id !== null && ids.has(parent_item_id) ? parent_item_id : null

  const walk = (parentId: string | null, numberPrefix: string, depth: number): PlacedItem[] =>
    items
      .filter((item) => parentOf(item) === parentId)
      .toSorted((a, b) => a.position - b.position)
      .flatMap((item, index) => {
        const outline = `${numberPrefix}${String(index + 1)}`
        const placed = { item: { ...item, outline_number: outline }, depth }
        return [placed, ...walk(item.id, `${outline}.`, depth + 1)]
      })
  return walk(null, '', 1)
}
