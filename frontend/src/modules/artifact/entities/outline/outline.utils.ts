import {
  contentFields,
  type ContentSchema,
  isNavigable,
  type IssueKind,
  itemTitle,
} from '@/modules/workflow/entities/@x/artifact'
import { groupBy } from '@/shared/lib/collections'
import { isEmpty } from '@/shared/lib/guards'
import { ancestorsOf } from '@/shared/lib/hierarchy'

import { type Artifact, reviewStatus } from '../artifacts/artifacts.types'
import { itemHierarchy } from '../items/item-hierarchy.utils'
import type { ArtifactItem, OutlineItem } from '../items/items.types'
import type { ItemStatus, StatusCount } from '../status/item-status.types'
import { itemStatus, mergeStatusCounts } from '../status/item-status.utils'
import type {
  ArrangedPlace,
  ArrangeInput,
  BreadcrumbStep,
  KindView,
  OutlineNeighbors,
  OutlineNode,
} from './outline.types'

// The order of a document: sections nest by `parent_item_id`; under a parent, the items that are not
// sections form runs of one kind, in the order of the item kinds of the artifact kind. The outline of
// the side panel and the parts of the page of a document both read this order from `arrangeItems`.

/** The id of the row of an item in the outline. */
export function itemNodeId(itemId: string): string {
  return `item:${itemId}`
}

/** The id of the block of an item on the page of its document, which the address of the item scrolls to. */
export function itemAnchorId(itemId: string): string {
  return `item-${itemId}`
}

/** The props that tie the block of an item to the address of the page: its anchor, a target of the focus, and `data-target` when the address names it. */
export function itemAnchorProps(itemId: string, targetItemId: string | null) {
  return {
    id: itemAnchorId(itemId),
    tabIndex: -1,
    ...(targetItemId === itemId ? { 'data-target': '' } : {}),
  } as const
}

function placeUnder(
  parentId: string | null,
  input: ArrangeInput,
  known: ReadonlySet<string>,
): ArrangedPlace {
  const inside = input.items.filter(({ parent_item_id }) =>
    parentId === null
      ? parent_item_id === null || !known.has(parent_item_id)
      : parent_item_id === parentId,
  )
  const isSection = (item: OutlineItem) => input.kinds.get(item.kind)?.display === 'heading'
  const rank = (kind: string) => {
    const index = input.itemKinds.indexOf(kind)
    return index === -1 ? input.itemKinds.length : index
  }
  const runs = groupBy(
    inside.filter((item) => !isSection(item)),
    ({ kind }) => kind,
  )
    .map(({ key, items }) => ({ kind: key, items }))
    .toSorted((a, b) => rank(a.kind) - rank(b.kind))
  return {
    sections: inside
      .filter(isSection)
      .map((item) => ({ item, place: placeUnder(item.id, input, known) })),
    runs,
  }
}

/** The items of an artifact in the order of its document (see the top of this file). */
export function arrangeItems(input: ArrangeInput): ArrangedPlace {
  return placeUnder(null, input, new Set(input.items.map(({ id }) => id)))
}

/**
 * The items of one document as its outline reads them: without the superseded, each with the
 * depth of its place. A read of the items of one artifact already comes with the depth, so this
 * serves the reads of a whole project, which have no place of their own.
 */
export function outlineItemsOf(items: readonly ArtifactItem[]): OutlineItem[] {
  const own = items.filter(({ review_status }) => review_status !== reviewStatus.superseded)
  return own.map((item) => ({ ...item, depth: depthOf(item, own) }))
}

/** The depth of an item in its outline: 1 at the top, one more under each parent. */
function depthOf(item: ArtifactItem, own: readonly ArtifactItem[]): number {
  const parent = own.find(({ id }) => id === item.parent_item_id)
  return parent === undefined ? 1 : depthOf(parent, own) + 1
}

function countOf(place: ArrangedPlace): number {
  return (
    place.runs.reduce((total, { items }) => total + items.length, 0) +
    place.sections.reduce((total, { place: inner }) => total + countOf(inner), 0)
  )
}

interface OutlineContext extends ArrangeInput {
  issueKinds: readonly IssueKind[]
  /** The items made from an older version of an item they link to; empty by default. */
  outOfDateIds: ReadonlySet<string>
}

function runNodes(place: ArrangedPlace, context: OutlineContext, parentId: string): OutlineNode[] {
  return place.runs.flatMap(({ kind, items }) => {
    const view = context.kinds.get(kind)
    if (view !== undefined && !isNavigable(view.schema)) return []
    const children: OutlineNode[] = items.map((item) => ({
      type: 'item',
      id: itemNodeId(item.id),
      item,
      title: itemTitle(view?.schema, item),
      status: itemStatus(item, context.issueKinds, { outOfDateIds: context.outOfDateIds }),
    }))
    return [
      {
        type: 'group',
        id: `group:${parentId}:${kind}`,
        kind,
        title: view?.title ?? kind,
        count: items.length,
        statusCounts: statusCountsOf(children),
        children,
      },
    ]
  })
}

/** The statuses of the items under the rows given, the ones in the sections and groups included. */
function statusCountsOf(nodes: readonly OutlineNode[]): StatusCount[] {
  return mergeStatusCounts(
    nodes.map((node) => {
      if (node.type === 'item') return [{ status: node.status, count: 1 }]
      return isBranch(node) ? node.statusCounts : []
    }),
  )
}

function placeNodes(
  place: ArrangedPlace,
  context: OutlineContext,
  parentId: string,
): OutlineNode[] {
  const sections: OutlineNode[] = place.sections.map(({ item, place: inner }) => {
    const children = placeNodes(inner, context, item.id)
    return {
      type: 'section',
      id: `section:${item.id}`,
      item,
      title: itemTitle(context.kinds.get(item.kind)?.schema, item),
      count: countOf(inner),
      statusCounts: statusCountsOf(children),
      children,
    }
  })
  return [...sections, ...runNodes(place, context, parentId)]
}

/**
 * The outline of an artifact, in the order of the document. An artifact without items gives one row
 * for each filled field of its content. A section or a group counts the statuses of the rows under
 * it; how much they ask of the user depends on the review, so the reader decides it.
 */
export function artifactOutline(
  input: ArrangeInput & {
    artifact: Pick<Artifact, 'id' | 'content'>
    artifactSchema: ContentSchema | undefined
    issueKinds: readonly IssueKind[]
    /** The items made from an older version of an item they link to; empty by default. */
    outOfDateIds?: ReadonlySet<string>
  },
): OutlineNode[] {
  if (input.items.length === 0) {
    if (input.artifactSchema === undefined) return []
    return contentFields(input.artifactSchema)
      .filter(({ name }) => !isEmpty(input.artifact.content[name]))
      .map(({ name, title }) => ({ type: 'field', id: `field:${name}`, name, title }))
  }
  return placeNodes(
    arrangeItems(input),
    { ...input, outOfDateIds: input.outOfDateIds ?? new Set() },
    'root',
  )
}

/** Whether a row of the outline holds rows under it: a section or a group of items. */
export function isBranch(node: OutlineNode): node is Extract<OutlineNode, { children: unknown }> {
  return node.type === 'section' || node.type === 'group'
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
