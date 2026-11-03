import { collectBy } from '@/shared/lib/collections'

import type {
  Citation,
  ItemLinkGroup,
  ItemLinkRow,
  LinkQuote,
  OriginStep,
  OriginTree,
  Trace,
  TraceItem,
} from '../types/chains.types'
import type { TraceLink } from '../types/trace-links.types'
import { isLinkOutOfDate } from './trace-links.utils'

// The rules of reading a trace: where an item comes from, the quoted words of every item, the
// items made from an older version of what they link to, and the links of an item by type.

function itemById(trace: Trace): Map<string, TraceItem> {
  return new Map(trace.items.map((item) => [item.id, item]))
}

// The citations of an item: its `evidenced_by` links with the item each cites, in key order.
function citationsOf(
  item: TraceItem,
  links: readonly TraceLink[],
  byId: Map<string, TraceItem>,
): Citation[] {
  return links
    .filter(
      ({ link_type, source_item_id }) => link_type === 'evidenced_by' && source_item_id === item.id,
    )
    .flatMap((link) => {
      const cited = byId.get(link.target_item_id)
      return cited === undefined ? [] : [{ link, quote: link.target_quote, citing: item, cited }]
    })
    .toSorted((first, second) => first.cited.key.localeCompare(second.cited.key))
}

// The steps of the origin of an item: one per `derived_from` target, each with its own citations
// and steps. An item met twice is a step once, under its first path, and a loop is walked once.
function stepsOf(
  item: TraceItem,
  links: readonly TraceLink[],
  byId: Map<string, TraceItem>,
  seen: Set<string>,
): OriginStep[] {
  return links
    .filter(
      ({ link_type, source_item_id }) => link_type === 'derived_from' && source_item_id === item.id,
    )
    .flatMap((link) => {
      const target = byId.get(link.target_item_id)
      if (target === undefined || seen.has(target.id)) return []
      seen.add(target.id)
      return [
        {
          link,
          item: target,
          evidence: citationsOf(target, links, byId),
          steps: stepsOf(target, links, byId, seen),
        },
      ]
    })
    .toSorted((first, second) => first.item.key.localeCompare(second.item.key))
}

/**
 * Where an item comes from: the words it cites itself (`evidenced_by`), and one step per
 * `derived_from` target with what that item cites and is based on in turn, down to the interview.
 */
export function originOf(trace: Trace, itemId: string): OriginTree {
  const byId = itemById(trace)
  const start = byId.get(itemId)
  if (start === undefined) return { evidence: [], steps: [] }
  const seen = new Set<string>([itemId])
  return {
    evidence: citationsOf(start, trace.links, byId),
    steps: stepsOf(start, trace.links, byId, seen),
  }
}

/**
 * The quoted words of every item of a trace, by item id: the `source_quote` of a link on its
 * source, its `target_quote` on its target, in the key order of the other items.
 */
export function linkQuotesByItem(trace: Trace): ReadonlyMap<string, LinkQuote[]> {
  const byId = itemById(trace)
  const byItem = new Map<string, LinkQuote[]>()
  const add = (item: TraceItem, quote: LinkQuote) => {
    byItem.set(item.id, [...(byItem.get(item.id) ?? []), quote])
  }
  for (const link of trace.links) {
    const source = byId.get(link.source_item_id)
    const target = byId.get(link.target_item_id)
    if (link.source_quote !== null && source !== undefined && target !== undefined) {
      add(source, { link, side: 'source', quote: link.source_quote, other: target })
    }
    if (link.target_quote !== null && source !== undefined && target !== undefined) {
      add(target, { link, side: 'target', quote: link.target_quote, other: source })
    }
  }
  for (const [id, quotes] of byItem) {
    byItem.set(
      id,
      quotes.toSorted((first, second) => first.other.key.localeCompare(second.other.key)),
    )
  }
  return byItem
}

/** The sources of the links that were made against an older version of their target, or of a target that was replaced. */
export function outOfDateItemIds(trace: Trace): ReadonlySet<string> {
  const byId = itemById(trace)
  const ids = new Set<string>()
  for (const link of trace.links) {
    const target = byId.get(link.target_item_id)
    if (target !== undefined && isLinkOutOfDate(link, target)) ids.add(link.source_item_id)
  }
  return ids
}

/**
 * The links of an item by type and direction: the links whose source it is, then those whose
 * target it is, each grouped by link type in the order of the definition, the rows in key order.
 * A link type missing from `linkTypes` comes last, titled by its key.
 */
export function itemLinkGroups(
  trace: Trace,
  itemId: string,
  {
    linkTypes,
    titleOf,
  }: {
    linkTypes: readonly { key: string; title: string }[]
    titleOf: (item: TraceItem) => string
  },
): { outgoing: ItemLinkGroup[]; incoming: ItemLinkGroup[] } {
  const byId = itemById(trace)
  const rowOf = (link: TraceLink, other: TraceItem): ItemLinkRow => {
    const target = byId.get(link.target_item_id)
    return {
      link,
      other,
      title: titleOf(other),
      isOutOfDate: target !== undefined && isLinkOutOfDate(link, target),
    }
  }
  const groupsOf = (links: readonly TraceLink[], otherKey: 'target_item_id' | 'source_item_id') => {
    const rows = links.flatMap((link) => {
      const other = byId.get(link[otherKey])
      return other === undefined ? [] : [rowOf(link, other)]
    })
    const rowsByType = collectBy(rows, ({ link }) => link.link_type)
    const rankOf = (key: string) => {
      const index = linkTypes.findIndex((type) => type.key === key)
      return index === -1 ? linkTypes.length : index
    }
    return [...rowsByType.entries()]
      .map(([linkType, rowsOfType]) => ({
        linkType,
        title: linkTypes.find((type) => type.key === linkType)?.title ?? linkType,
        rows: rowsOfType.toSorted((first, second) =>
          first.other.key.localeCompare(second.other.key),
        ),
      }))
      .toSorted(
        (first, second) =>
          rankOf(first.linkType) - rankOf(second.linkType) ||
          first.title.localeCompare(second.title),
      )
  }
  return {
    outgoing: groupsOf(
      trace.links.filter(({ source_item_id }) => source_item_id === itemId),
      'target_item_id',
    ),
    incoming: groupsOf(
      trace.links.filter(({ target_item_id }) => target_item_id === itemId),
      'source_item_id',
    ),
  }
}
