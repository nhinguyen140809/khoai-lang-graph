import type { ArtifactKinds, ContentSchema, OutlineItem } from './artifacts.types'

/** The content schema of every kind, artifact kinds and item kinds alike, by kind name. */
export function schemasByKind(kinds: ArtifactKinds | undefined): Map<string, ContentSchema> {
  const schemas = new Map<string, ContentSchema>()
  for (const artifactKind of kinds?.artifact_kinds ?? []) {
    schemas.set(artifactKind.kind, artifactKind.schema)
    for (const itemKind of artifactKind.item_kinds) schemas.set(itemKind.kind, itemKind.schema)
  }
  return schemas
}

/** Whether the items of an artifact are nested: sections with items inside, or epics with stories. */
export function isNested(items: { parent_item_id: string | null }[]): boolean {
  return items.some(({ parent_item_id }) => parent_item_id !== null)
}

export interface KindGroup {
  kind: string
  items: OutlineItem[]
}

/** The items of an artifact without sections, grouped by kind in the order the kinds first appear. */
export function groupByKind(items: OutlineItem[]): KindGroup[] {
  const groups: KindGroup[] = []
  for (const item of items) {
    const group = groups.find(({ kind }) => kind === item.kind)
    if (group === undefined) groups.push({ kind: item.kind, items: [item] })
    else group.items.push(item)
  }
  return groups
}

/** The sections and epics above an item, from the top level down to its parent. */
export function ancestorsOf(
  item: { parent_item_id: string | null },
  items: { id: string; parent_item_id: string | null }[],
): { id: string; parent_item_id: string | null }[] {
  const chain: { id: string; parent_item_id: string | null }[] = []
  let parentId = item.parent_item_id
  while (parentId !== null) {
    const parent = items.find(({ id }) => id === parentId)
    if (parent === undefined) break
    chain.unshift(parent)
    parentId = parent.parent_item_id
  }
  return chain
}
