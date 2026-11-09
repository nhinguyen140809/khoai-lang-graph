'use client'

import { ChevronRightIcon } from 'lucide-react'

import { useProjectId } from '@/modules/project/entities'
import { type ChainGraph, linkSentenceParts } from '@/modules/trace/entities'
import { PageLink } from '@/shared/components/frame'
import { Button } from '@/shared/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible'
import { routes } from '@/shared/routes'

import { itemTraceMessages } from '../item-trace.constants'

/**
 * The links of the chain as a list of sentences, for a reader who prefers text. It opens under the
 * graph, in the scroll of the page: each link is a row of its own, its two items in bold as links
 * and the words that join them muted, so the eye finds the items first.
 */
export function ChainAsText({ graph }: { graph: ChainGraph }) {
  const project = routes.project(useProjectId())
  // One pass over the nodes, so each sentence finds both its titles without walking the list again.
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]))
  return (
    <Collapsible className="shrink-0 border-t px-6 py-2">
      <CollapsibleTrigger asChild>
        {/* No padding of its own, so the line starts where the rows under it start. */}
        <Button variant="link" size="sm" className="px-0">
          <ChevronRightIcon
            aria-hidden
            className="size-4 transition-transform in-data-[state=open]:rotate-90 motion-reduce:transition-none"
          />
          {itemTraceMessages.asList}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="divide-y pb-3 text-sm">
          {graph.edges.map((edge) => {
            const source = nodeById.get(edge.source)
            const target = nodeById.get(edge.target)
            const parts = linkSentenceParts(
              source?.title ?? '',
              { key: edge.linkType, title: edge.linkTitle },
              target?.title ?? '',
              { tense: 'now' },
            )
            return (
              <li key={edge.id} className="py-2.5 leading-relaxed">
                {parts.before}
                {source !== undefined && (
                  <PageLink href={project.item(source.id)} className="font-semibold">
                    {parts.source}
                  </PageLink>
                )}
                <span className="text-muted-foreground">{parts.between}</span>
                {target !== undefined && (
                  <PageLink href={project.item(target.id)} className="font-semibold">
                    {parts.target}
                  </PageLink>
                )}
                <span className="text-muted-foreground">{parts.after}</span>
              </li>
            )
          })}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}
