import type { Trace } from '../chains/chains.types'
import { isLinkOutOfDate } from '../links/trace-links.utils'
import { linkAttention } from './attention.utils'
import type { ChainContext, ChainGraph } from './trace-graph.types'

/**
 * The nodes and the edges of the graph of the chain of an item, in the order of its items and
 * links: each node names its item by its kind and its title, each edge carries the title of its
 * link with the words it quotes on each side. A link whose end is not among the items has no edge,
 * since the graph would have an edge to nothing.
 */
export function chainGraphOf(trace: Trace, context: ChainContext): ChainGraph {
  const itemById = new Map(trace.items.map((item) => [item.id, item]))
  return {
    nodes: trace.items.map((item) => ({
      id: item.id,
      artifactId: item.artifact_id,
      kind: item.kind,
      kindTitle: context.kindTitleOf(item),
      title: context.titleOf(item),
      key: item.key,
      content: item.content,
      reviewStatus: item.review_status,
      attention: context.attentionOf(item),
      isFocus: item.id === context.focusId,
    })),
    edges: trace.links.flatMap((link) => {
      const source = itemById.get(link.source_item_id)
      const target = itemById.get(link.target_item_id)
      if (source === undefined || target === undefined) return []
      return [
        {
          id: link.id,
          source: link.source_item_id,
          target: link.target_item_id,
          sourceArtifactId: source.artifact_id,
          linkType: link.link_type,
          linkTitle: context.linkTitleOf(link.link_type),
          attention: linkAttention(link, { source, target }, context.issueKinds),
          sourceQuote: link.source_quote,
          targetQuote: link.target_quote,
          madeFromVersion: isLinkOutOfDate(link, target) ? link.target_version : null,
        },
      ]
    }),
  }
}
