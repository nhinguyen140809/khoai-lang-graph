import { itemTitle } from '@/modules/workflow/entities/@x/artifact'
import { ancestorsOf } from '@/shared/lib/hierarchy'

import { itemHierarchy } from '../items/item-hierarchy.utils'
import type { OutlineItem } from '../items/items.types'
import type { ItemStatus } from '../status/item-status.types'
import type { BreadcrumbStep, KindView, OutlineNeighbors, OutlineNode } from './outline.types'

/** Whether a row of the outline holds rows under it: a section or a group of items. */
export function isBranch(node: OutlineNode): node is Extract<OutlineNode, { children: unknown }> {
  return node.type === 'section' || node.type === 'group'
}

/**
 * The rows from the top of the outline down to the row with this id, itself included, in that
 * order; empty when no row has the id.
 */
export function outlinePath(nodes: readonly OutlineNode[], id: string): OutlineNode[] {
  for (const node of nodes) {
    if (node.id === id) return [node]
    if (isBranch(node)) {
      const below = outlinePath(node.children, id)
      if (below.length > 0) return [node, ...below]
    }
  }
  return []
}

/** The rows of type `item` that a reader goes through, in order. */
function outlineLeaves(nodes: readonly OutlineNode[]): Extract<OutlineNode, { type: 'item' }>[] {
  return nodes.flatMap((node) => {
    if (node.type === 'item') return [node]
    return isBranch(node) ? outlineLeaves(node.children) : []
  })
}

/** The items of the outline that a reader goes through, in order (see `outlineLeaves`). */
export function outlineSequence(nodes: readonly OutlineNode[]): OutlineItem[] {
  return outlineLeaves(nodes).map(({ item }) => item)
}

/** The rows of type `item` of an outline, in order, each with its status. */
export function outlineStatuses(
  nodes: readonly OutlineNode[],
): { item: OutlineItem; status: ItemStatus }[] {
  return outlineLeaves(nodes).map(({ item, status }) => ({ item, status }))
}

/** The place of an item in the order that a reader goes through, with the item before and after it. */
export function outlineNeighbors(nodes: readonly OutlineNode[], itemId: string): OutlineNeighbors {
  const sequence = outlineSequence(nodes)
  const position = sequence.findIndex(({ id }) => id === itemId)
  return {
    index: position + 1,
    count: sequence.length,
    previous: position > 0 ? (sequence[position - 1] ?? null) : null,
    next: position >= 0 ? (sequence[position + 1] ?? null) : null,
  }
}

/**
 * The path from the document down to an item, as the outline draws it: the sections above the
 * item from the top down, each with its title in its kind, then the group of the kind of the item,
 * which is named by that kind. A section has no group.
 */
export function outlineBreadcrumb(
  item: Pick<OutlineItem, 'id' | 'kind' | 'parent_item_id'>,
  outline: { items: readonly OutlineItem[]; kinds: ReadonlyMap<string, KindView> },
): BreadcrumbStep[] {
  const sections = ancestorsOf(item, outline.items, itemHierarchy).map((section) => ({
    id: section.id,
    title: itemTitle(outline.kinds.get(section.kind)?.schema, section),
  }))
  const kind = outline.kinds.get(item.kind)
  if (kind?.display === 'heading') return sections
  return [...sections, { id: `group:${item.kind}`, title: kind?.title ?? item.kind }]
}
