import type { Hierarchy } from '@/shared/lib/hierarchy'

/** An item that may sit under another: a section holds items, an epic holds stories. */
interface PlacedInHierarchy {
  id: string
  parent_item_id: string | null
}

/** How the items of an artifact sit one under another, for the helpers of `@/shared/lib/hierarchy`. */
export const itemHierarchy: Hierarchy<PlacedInHierarchy> = {
  idOf: ({ id }) => id,
  parentIdOf: ({ parent_item_id }) => parent_item_id,
}
