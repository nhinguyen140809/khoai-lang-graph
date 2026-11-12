import { cn } from 'cn'
import { XIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/shared/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/shared/components/ui/context-menu'
import { routeOfAddress } from '@/shared/routes'

import type { EditorTab } from '../editor-tabs.types'
import { useTabStrip } from '../hooks/useTabStrip'
import { TabLabel } from './TabLabel'

interface TabItemProps {
  tab: EditorTab
  /** The tab has just closed or been replaced, and is shown a moment longer, folding up. */
  isLeaving?: boolean
  /** The strip has been on screen for a moment: a tab that mounts after it grows into place. */
  isStripReady?: boolean
}

/**
 * A tab of the strip: a link to its page, a close button, and its menu. The close button shows on
 * every tab, so that closing never needs the pointer over it. A middle click closes the tab too,
 * and a double click keeps a preview tab.
 */
export function TabItem({ tab, isLeaving = false, isStripReady = false }: TabItemProps) {
  const { tabs, onScreen, previewId, keep, close } = useTabStrip()
  // Read once, as the tab mounts: the tabs of the first render stay as they are.
  const [isEntering] = useState(isStripReady)
  const isActive = tab.id === onScreen
  const isPreview = tab.id === previewId
  const ids = tabs.map(({ id }) => id)
  const onKeep = () => {
    keep(tab.id)
  }
  const onClose = () => {
    close([tab.id])
  }

  if (isLeaving) {
    return (
      // It takes no room, and fades where it stood, over the tab that takes its place: the two
      // cross in one place instead of one making way for the other.
      <li
        aria-hidden
        inert
        className="pointer-events-none relative z-10 w-0 shrink-0 animate-out duration-100 fade-out-0 fill-mode-forwards motion-reduce:hidden"
      >
        <div className="absolute inset-y-0 left-0 flex w-max items-center border-r bg-sidebar text-sm text-muted-foreground">
          <span className="flex h-full max-w-56 items-center gap-1.5 pr-1 pl-3">
            <TabLabel tab={tab} preview={false} />
          </span>
          {/* The room of the close button, which a tab keeps whether it shows or not. */}
          <span className="mr-1 size-6 shrink-0" />
        </div>
      </li>
    )
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <li
          data-active={isActive}
          data-preview={isPreview}
          className={cn(
            'group/tab relative flex shrink-0 items-center border-r text-sm data-[active=false]:text-muted-foreground data-[active=false]:hover:bg-sidebar-accent/60 data-[active=false]:hover:text-foreground data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:before:absolute data-[active=true]:before:inset-x-0 data-[active=true]:before:top-0 data-[active=true]:before:h-px data-[active=true]:before:bg-primary',
            isEntering && 'animate-in duration-100 fade-in-0 motion-reduce:animate-none',
          )}
        >
          <Link
            href={routeOfAddress(tab.href)}
            aria-current={isActive ? 'page' : undefined}
            title={tab.title}
            onAuxClick={(event) => {
              if (event.button !== 1) return
              event.preventDefault()
              onClose()
            }}
            onDoubleClick={onKeep}
            className="flex h-full max-w-56 items-center gap-1.5 pr-1 pl-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
          >
            <TabLabel tab={tab} preview={isPreview} />
          </Link>
          {/* On the active tab, under the pointer and with the focus, and on every tab of a touch
              screen, which has no pointer to show it. It keeps its place while hidden, so that the
              tab does not move when it shows. */}
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Close ${tab.title}`}
            onClick={onClose}
            className="mr-1 text-muted-foreground opacity-0 group-focus-within/tab:opacity-100 group-hover/tab:opacity-100 group-data-[active=true]/tab:opacity-100 pointer-coarse:opacity-100"
          >
            <XIcon aria-hidden className="size-3.5" />
          </Button>
        </li>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem disabled={!isPreview} onSelect={onKeep}>
          Keep open
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={onClose}>Close</ContextMenuItem>
        <ContextMenuItem
          // The only open tab has no other tabs to close.
          disabled={tabs.length === 1}
          onSelect={() => {
            close(ids.filter((id) => id !== tab.id))
          }}
        >
          Close other tabs
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            close(ids)
          }}
        >
          Close all tabs
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
