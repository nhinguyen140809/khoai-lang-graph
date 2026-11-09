'use client'

import { useProjectId } from '@/modules/project/entities'
import { type ChainGraph, type LinkQuote, QuotedItemCard } from '@/modules/trace/entities'
import { useContentSchemas } from '@/modules/workflow/entities'
import { Alert, AlertTitle } from '@/shared/components/ui/alert'
import { routes } from '@/shared/routes'

import { chainEdgeLooks } from '../item-trace.constants'

/**
 * The strip of the chosen link: its title, and under it one card for each side that has words it
 * quotes, each holding the kind of its item, its title and those words (see `QuotedItemCard`), side
 * by side where there is room. It sits below the graph, so no node changes size and nothing on the
 * canvas moves.
 */
export function ChainChosenLink({ graph, linkId }: { graph: ChainGraph; linkId: string }) {
  const project = routes.project(useProjectId())
  const schemas = useContentSchemas()
  const edge = graph.edges.find(({ id }) => id === linkId)
  if (edge === undefined) return null
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]))

  const card = (side: LinkQuote['side'], quote: string | null) => {
    const node = nodeById.get(side === 'source' ? edge.source : edge.target)
    if (node === undefined || quote === null || quote === '') return null
    return (
      <QuotedItemCard
        key={side}
        href={project.item(node.id)}
        kind={node.kindTitle}
        item={{ key: node.key, content: node.content, schema: schemas.get(node.kind) }}
        quote={quote}
        side={side}
      />
    )
  }

  return (
    <Alert color={chainEdgeLooks[edge.attention].color} className="shrink-0 px-6 py-2">
      <AlertTitle className="text-sm font-semibold">{edge.linkTitle}</AlertTitle>
      <div className="mt-1 grid gap-2 md:grid-cols-2">
        {card('source', edge.sourceQuote)}
        {card('target', edge.targetQuote)}
      </div>
    </Alert>
  )
}
