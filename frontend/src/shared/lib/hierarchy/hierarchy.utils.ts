import type { Hierarchy, Nested } from './hierarchy.types'

/** Whether some item sits under another. */
export function isNested<T>(items: readonly T[], { parentIdOf }: Hierarchy<T>): boolean {
  return items.some((item) => parentIdOf(item) !== null)
}

/**
 * The items above an item, from the top level down to its parent. The chain ends where a parent is
 * not among the items.
 */
export function ancestorsOf<T>(item: T, items: readonly T[], hierarchy: Hierarchy<T>): T[] {
  const { idOf, parentIdOf } = hierarchy
  const chain: T[] = []
  let parentId = parentIdOf(item)
  while (parentId !== null) {
    const parent = items.find((candidate) => idOf(candidate) === parentId)
    if (parent === undefined) break
    chain.unshift(parent)
    parentId = parentIdOf(parent)
  }
  return chain
}

/** The items inside an item, at any depth, level by level. */
export function descendantsOf<T>(item: T, items: readonly T[], hierarchy: Hierarchy<T>): T[] {
  const { idOf, parentIdOf } = hierarchy
  const found: T[] = []
  let frontier = new Set([idOf(item)])
  while (frontier.size > 0) {
    const inside = items.filter((candidate) => {
      const parentId = parentIdOf(candidate)
      return parentId !== null && frontier.has(parentId)
    })
    found.push(...inside)
    frontier = new Set(inside.map(idOf))
  }
  return found
}

/**
 * The items one inside another: each item under its parent, in the order given. An item whose
 * parent is not among the items is at the top level.
 */
export function toNested<T>(items: readonly T[], { idOf, parentIdOf }: Hierarchy<T>): Nested<T>[] {
  const nodes = new Map<string, Nested<T>>(
    items.map((item) => [idOf(item), { ...item, children: [] }]),
  )
  const top: Nested<T>[] = []
  for (const node of nodes.values()) {
    const parentId = parentIdOf(node)
    const parent = parentId === null ? undefined : nodes.get(parentId)
    if (parent === undefined) top.push(node)
    else parent.children.push(node)
  }
  return top
}
