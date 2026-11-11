'use client'

import { TriangleAlertIcon } from 'lucide-react'

import { useIsProjectWriting } from '@/modules/project/entities'
import { liveTraceMs, useItemChain } from '@/modules/trace/entities'
import { useEditorTab } from '@/shared/components/frame'
import { ErrorState, LoadingState, NotFoundState } from '@/shared/components/state'
import { Button } from '@/shared/components/ui/button'
import { FloatingSurface } from '@/shared/components/ui/floating-surface'
import { useKeptScroll } from '@/shared/lib/memory'
import { routes } from '@/shared/routes'

import { useChainLayout } from '../hooks/useChainLayout'
import { useChainSelection } from '../hooks/useChainSelection'
import { itemTraceMessages } from '../item-trace.constants'
import { ChainAsText } from './ChainAsText'
import { ChainCanvas } from './ChainCanvas'
import { ChainChosenLink } from './ChainChosenLink'
import { ChainLegend } from './ChainLegend'

/**
 * The page of the chain of one item: the graph of what it is based on, down to the interviews on
 * the left, and what was built from it on the right. The edges carry the title of their link and
 * their look says how much they ask of the user; choosing one shows the words it quotes in its
 * two nodes. A menu on a node holds the actions on its item, a menu on an edge the actions on
 * its link, and under the graph the links read as a list.
 */
export function ItemTracePage({ projectId, itemId }: { projectId: string; itemId: string }) {
  const isWriting = useIsProjectWriting(projectId)
  const chain = useItemChain(projectId, itemId, {
    refetchInterval: isWriting ? liveTraceMs : false,
  })
  const { selectedLinkId, select, clear } = useChainSelection()
  const layout = useChainLayout(chain.state === 'success' ? chain.graph : undefined)
  const keptScroll = useKeptScroll('page')

  useEditorTab({
    id: itemId,
    title:
      chain.state === 'success'
        ? itemTraceMessages.title(chain.focus.title)
        : chain.state === 'error'
          ? itemTraceMessages.errorTab
          : itemTraceMessages.loading,
    href: routes.project(projectId).itemTrace(itemId),
  })

  if (chain.state === 'error') {
    return (
      <ErrorState
        message={itemTraceMessages.loadError}
        onRetry={() => {
          chain.retry()
        }}
      />
    )
  }
  if (chain.state === 'notFound') {
    return (
      <NotFoundState
        title={itemTraceMessages.notFound.title}
        description={itemTraceMessages.notFound.description}
      />
    )
  }
  if (chain.state === 'pending' || layout.state === 'pending') {
    return <LoadingState label={itemTraceMessages.loading} layout="detail" rows={3} />
  }
  if (layout.state === 'error') {
    return <ErrorState message={itemTraceMessages.loadError} onRetry={layout.retry} />
  }

  const { graph, focus } = chain
  const outOfDate = graph.edges.filter(({ madeFromVersion }) => madeFromVersion !== null)

  return (
    // The page scrolls as a whole: the graph takes what the window leaves, never less than its
    // minimum, and the strip and the list of links open under it and are reached by scrolling.
    <div ref={keptScroll} className="flex h-full flex-col overflow-y-auto">
      <header className="shrink-0 px-6 pt-6 pb-2">
        <h1 className="text-2xl font-semibold">{itemTraceMessages.title(focus.title)}</h1>
      </header>
      <div className="relative min-h-96 flex-1">
        {/* The banners sit at the top, in the middle, at the height of the button of the legend
            at the right: the same surface, the same padding and a row as tall as its button. */}
        {graph.edges.length === 0 && (
          <FloatingSurface
            placement="top-center"
            variant="popover"
            size="sm"
            role="alert"
            className="p-1"
          >
            <p className="flex h-7 items-center px-2 text-sm font-semibold">
              {itemTraceMessages.noLink}
            </p>
          </FloatingSurface>
        )}
        {outOfDate.length > 0 && (
          <FloatingSurface
            placement="top-center"
            variant="popover"
            size="sm"
            color="warning"
            role="alert"
            className="p-1"
          >
            <div className="flex h-7 items-center gap-2 pl-2">
              <TriangleAlertIcon aria-hidden className="size-4 text-warning-strong" />
              <p className="text-sm font-semibold">
                {itemTraceMessages.outOfDateLinks(outOfDate.length)}
              </p>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => {
                  const first = outOfDate[0]
                  if (first !== undefined) select(first.id)
                }}
              >
                {itemTraceMessages.showOutOfDate}
              </Button>
            </div>
          </FloatingSurface>
        )}
        <ChainCanvas
          graph={graph}
          positions={layout.positions}
          selectedLinkId={selectedLinkId}
          onSelect={select}
          onClear={clear}
          onEscape={clear}
        />
        <ChainLegend />
      </div>
      {selectedLinkId !== null && <ChainChosenLink graph={graph} linkId={selectedLinkId} />}
      <ChainAsText graph={graph} />
    </div>
  )
}
