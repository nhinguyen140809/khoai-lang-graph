'use client'

import { EdgeLabelRenderer, type EdgeProps } from '@xyflow/react'
import { cn } from 'cn'
import { HistoryIcon, QuoteIcon } from 'lucide-react'
import type { ComponentProps } from 'react'

import { useEditLockReason } from '@/modules/documents/entities'
import { useProjectId } from '@/modules/project/entities'
import type { ChainEdgeData } from '@/modules/trace/entities'
import { useUnlinkAction } from '@/modules/trace/features/remove-link'
import { ContextMenuSeparator } from '@/shared/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Edge } from '@/shared/components/ui/edge'
import { DropdownActionItem } from '@/shared/components/ui/menu-action'
import { smoothEdgePath } from '@/shared/lib/graph'
import { type Tone, toneClasses } from '@/shared/lib/tone'

import { chainEdgeLooks, chainGaps, itemTraceMessages } from '../item-trace.constants'
import type { ChainEdgeView, ChainFlowEdge } from '../item-trace.types'

/** The data an edge falls back to while none was drawn for it. */
const fallbackEdge: ChainEdgeView = {
  id: 'edge',
  source: '',
  target: '',
  sourceArtifactId: '',
  linkType: '',
  linkTitle: '',
  attention: 'none',
  sourceQuote: null,
  targetQuote: null,
  madeFromVersion: null,
  isSelected: false,
  onSelect: () => undefined,
}

/** The line of one edge, with the title of its link on a label that opens its menu. */
export function ChainEdgeLine({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps<ChainFlowEdge>) {
  // The arrow points from the item to the item it is based on, and its head follows the curve: the
  // line stops a little before the node, so the ring of the end of the link does not cover the tip.
  const { path, labelX, labelY } = smoothEdgePath(
    { x: sourceX, y: sourceY },
    { x: targetX, y: targetY },
    { endGap: chainGaps.arrow },
  )
  const edge: ChainEdgeView = data ?? fallbackEdge
  const look = chainEdgeLooks[edge.attention]

  return (
    <>
      <Edge
        id={id}
        path={path}
        variant={look.variant}
        weight={look.weight}
        color={look.color}
        arrow
      />
      <EdgeLabelRenderer>
        {/* The renderer of the labels takes no pointer events, so the label gives them back:
            a click opens the menu of the link instead of choosing the edge under it. */}
        <div
          className="nodrag nopan pointer-events-auto rounded-full bg-background"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${String(labelX)}px, ${String(labelY)}px)`,
          }}
        >
          <DropdownMenu
            onOpenChange={(isOpen) => {
              if (isOpen) edge.onSelect()
            }}
          >
            <DropdownMenuTrigger asChild>
              {/* A link carries its title alone, as wide as the space between two nodes; the words
                  it quotes sit in the strip of the chosen link, below the graph. */}
              <EdgeTitleButton
                color={look.color}
                isSelected={edge.isSelected}
                title={edge.linkTitle}
              >
                {edge.madeFromVersion !== null && (
                  <HistoryIcon aria-hidden className="mr-0.5 inline size-3" />
                )}
                {edge.linkTitle}
              </EdgeTitleButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <EdgeMenuContent edge={edge} onSelect={edge.onSelect} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

/**
 * The title of a link on its edge: its words in the color of the level of the link, with no border
 * and no fill at rest, a soft fill under the pointer, and a solid fill in the strong color of that
 * tone, with the color of the page for its words, when it has the focus, is the chosen link or has
 * its menu open, so the link in hand stands out. It draws no border and no ring in any state.
 */
function EdgeTitleButton({
  color,
  isSelected,
  className,
  ...props
}: Omit<ComponentProps<'button'>, 'color'> & { color: Tone; isSelected: boolean }) {
  return (
    <button
      type="button"
      data-selected={isSelected ? '' : undefined}
      className={cn(
        toneClasses[color],
        'max-w-24 truncate rounded-full px-2 py-0.5 text-xs font-semibold text-(--tone-strong) transition-colors outline-none hover:bg-(--tone-soft) focus-visible:bg-(--tone-strong) focus-visible:text-background data-[state=open]:bg-(--tone-strong) data-[state=open]:text-background data-selected:bg-(--tone-strong) data-selected:text-background',
        className,
      )}
      {...props}
    />
  )
}

/** The menu of an edge: showing the words its link quotes, and removing the link. */
function EdgeMenuContent({ edge, onSelect }: { edge: ChainEdgeData; onSelect: () => void }) {
  const lockedReason = useEditLockReason(useProjectId(), edge.sourceArtifactId)
  const remove = useUnlinkAction({ id: edge.id, source_item_id: edge.source }, lockedReason)

  return (
    <>
      <DropdownMenuItem
        disabled={edge.sourceQuote === null && edge.targetQuote === null}
        onSelect={onSelect}
      >
        <QuoteIcon aria-hidden />
        {itemTraceMessages.menu.showQuotes}
      </DropdownMenuItem>
      <ContextMenuSeparator />
      <DropdownActionItem
        icon={remove.icon}
        label={remove.label}
        disabledReason={remove.disabledReason}
        tone={remove.tone}
        onSelect={remove.run}
      />
    </>
  )
}
