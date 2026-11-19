'use client'

import { ArrowLeftIcon } from 'lucide-react'
import { type ReactNode, useId } from 'react'

import { ReferenceOpenerProvider } from '@/modules/activity/entities'
import { Button } from '@/shared/components/ui/button'
import {
  AnimatedResizablePanel,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/shared/components/ui/resizable'
import { Sheet, SheetContent, SheetTitle } from '@/shared/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { cn } from '@/shared/lib/cn'
import { useIsMobile } from '@/shared/lib/viewport'

import { useReaderView } from '../hooks/useReaderView'
import { readerMessages } from '../reader.constants'
import type { ReaderView } from '../reader.types'
import { viewKey } from '../reader.utils'
import { ReaderContent } from './ReaderContent'

// The reader keeps no size of its own between openings: it starts at its share each time the
// window changes, so there is nothing to store.
const noSizeToKeep = () => undefined

interface ReaderSplitProps {
  projectId: string
  /** The chat, which keeps its place and its state while the reader opens and closes. */
  children: ReactNode
}

/**
 * The chat of a project with the reader, read-only, of the document or the item that the chat
 * names, or of the list of the documents that `DocumentsButton` opens. On a wide screen the reader
 * opens beside the chat, which stays in use: the two share the width, and the handle between them
 * resizes them. On a narrow screen the reader opens in a sheet over the chat. What the reader
 * shows is in the query of the page, so that Back closes it.
 */
export function ReaderSplit({ projectId, children }: ReaderSplitProps) {
  const reader = useReaderView()
  const isMobile = useIsMobile()
  const beside = isMobile ? null : reader.shown

  return (
    <ReferenceOpenerProvider opener={reader.open}>
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel id="chat" minSize="30%">
          {children}
        </ResizablePanel>
        {/* The reader grows and shrinks beside the chat, as the panels of the frame do, and keeps
            its last view while it shrinks. */}
        <AnimatedResizablePanel
          id="reader"
          isVisible={!isMobile && reader.view !== null}
          defaultSize="45%"
          minSize="30%"
          handle="before"
          onResize={noSizeToKeep}
          onCollapse={reader.close}
        >
          {beside !== null && (
            <ReaderPane
              key={viewKey(beside)}
              projectId={projectId}
              view={beside}
              hrefOf={reader.hrefOf}
              canGoBack={reader.canGoBack}
              onBack={reader.back}
            />
          )}
        </AnimatedResizablePanel>
      </ResizablePanelGroup>
      {isMobile && (
        <Sheet
          open={reader.view !== null}
          onOpenChange={(open) => {
            if (!open) reader.close()
          }}
        >
          <SheetContent className="gap-0 data-[side=right]:w-full" aria-describedby={undefined}>
            {reader.shown !== null && (
              <ReaderContent
                key={viewKey(reader.shown)}
                projectId={projectId}
                view={reader.shown}
                hrefOf={reader.hrefOf}
                renderTitle={(title) => (
                  <SheetTitle asChild>
                    <span className="sr-only">{title}</span>
                  </SheetTitle>
                )}
              />
            )}
          </SheetContent>
        </Sheet>
      )}
    </ReferenceOpenerProvider>
  )
}

interface ReaderPaneProps {
  projectId: string
  view: ReaderView
  hrefOf: ReturnType<typeof useReaderView>['hrefOf']
  canGoBack: boolean
  onBack: () => void
}

/**
 * The reader beside the chat, named after its title. A button floats at its top left, while there
 * is a view before this one, and goes back to it.
 */
function ReaderPane({ projectId, view, hrefOf, canGoBack, onBack }: ReaderPaneProps) {
  const titleId = useId()

  return (
    <aside aria-labelledby={titleId} className="relative flex h-full min-w-0 flex-col border-l">
      {canGoBack && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              className="absolute top-2 left-2 z-10 bg-background shadow-xs"
              onClick={onBack}
            >
              <ArrowLeftIcon aria-hidden />
              <span className="sr-only">{readerMessages.back}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{readerMessages.back}</TooltipContent>
        </Tooltip>
      )}
      <div className={cn('flex min-h-0 flex-1 flex-col', canGoBack && 'pt-10')}>
        <ReaderContent
          projectId={projectId}
          view={view}
          hrefOf={hrefOf}
          renderTitle={(title) => (
            <span id={titleId} className="sr-only">
              {title}
            </span>
          )}
        />
      </div>
    </aside>
  )
}
