import { collectBy, rankIn } from '@/shared/lib/collections'

import type { TraceLink } from '../links/trace-links.types'
import { isLinkOutOfDate } from '../links/trace-links.utils'
import type { ItemLinkGroup, ItemLinkRow, LinkQuote, Trace, TraceItem } from './chains.types'

// The rules of reading a trace: the quoted words of every item, the items made from an older
// version of what they link to, and the links of an item by type.

function itemById(trace: Trace): Map<string, TraceItem> {
  return new Map(trace.items.map((item) => [item.id, item]))
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
    kindTitleOf,
  }: {
    linkTypes: readonly { key: string; title: string }[]
    titleOf: (item: TraceItem) => string
    kindTitleOf: (item: TraceItem) => string
  },
): { outgoing: ItemLinkGroup[]; incoming: ItemLinkGroup[] } {
  const byId = itemById(trace)
  const rowOf = (link: TraceLink, other: TraceItem): ItemLinkRow => {
    const target = byId.get(link.target_item_id)
    return {
      link,
      other,
      kindTitle: kindTitleOf(other),
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
    const order = linkTypes.map(({ key }) => key)
    const rankOf = (key: string) => rankIn(order, key)
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
