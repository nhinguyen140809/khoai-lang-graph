import { reviewStatus } from '@/modules/artifact/entities'
import { isLinkOutOfDate, type Trace, type TraceItem } from '@/modules/trace/entities'

import type { TraceGraph } from './trace-graph.types'

/**
 * The nodes and the edges of the graph of a trace, in the order of its items and links. `titleOf`
 * gives the title of an item, which depends on the content schema of its kind. A link whose end is
 * not among the items has no edge, since the graph would have an edge to nothing.
 */
export function traceGraphOf(trace: Trace, titleOf: (item: TraceItem) => string): TraceGraph {
  const itemById = new Map(trace.items.map((item) => [item.id, item]))
  return {
    nodes: trace.items.map((item) => ({
      id: item.id,
      key: item.key,
      kind: item.kind,
      title: titleOf(item),
      version: item.version,
      reviewStatus: item.review_status,
      isSuperseded: item.review_status === reviewStatus.superseded,
    })),
    edges: trace.links.flatMap((link) => {
      const target = itemById.get(link.target_item_id)
      if (target === undefined || !itemById.has(link.source_item_id)) return []
      return [
        {
          id: link.id,
          source: link.source_item_id,
          target: link.target_item_id,
          linkType: link.link_type,
          isOutOfDate: isLinkOutOfDate(link, target),
          quote: link.quote,
        },
      ]
    }),
  }
}
