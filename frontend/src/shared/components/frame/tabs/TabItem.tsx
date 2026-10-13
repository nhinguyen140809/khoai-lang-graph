import { XIcon } from 'lucide-react'
import type { Route } from 'next'
import Link from 'next/link'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/shared/components/ui/context-menu'

import type { EditorTab } from './editor-tabs.store'
import { TabLabel } from './TabLabel'

interface TabItemProps {
  tab: EditorTab
  /** The tab of the page on screen. */
  active: boolean
  /** The preview tab of the group, which the next page opened replaces. */
  preview: boolean
  /** The only open tab, so its menu has no other tabs to close. */
  alone: boolean
  onKeep: () => void
  onClose: () => void
  onCloseOthers: () => void
  onCloseAll: () => void
}

/**
 * A tab of the strip: a link to its page, a close button, and its menu. The close button shows on
 * every tab, so that closing never needs the pointer over it. A middle click closes the tab too,
 * and a double click keeps a preview tab.
 */
export function TabItem({
  tab,
  active,
  preview,
  alone,
  onKeep,
  onClose,
  onCloseOthers,
  onCloseAll,
}: TabItemProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <li
          data-active={active}
          data-preview={preview}
          className="group/tab relative flex shrink-0 items-center border-r text-sm data-[active=false]:text-muted-foreground data-[active=false]:hover:bg-sidebar-accent/60 data-[active=false]:hover:text-foreground data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:before:absolute data-[active=true]:before:inset-x-0 data-[active=true]:before:top-0 data-[active=true]:before:h-px data-[active=true]:before:bg-primary"
        >
          <Link
            href={tab.href as Route}
            aria-current={active ? 'page' : undefined}
            title={tab.title}
            onAuxClick={(event) => {
              if (event.button !== 1) return
              event.preventDefault()
              onClose()
            }}
            onDoubleClick={onKeep}
            className="flex h-full max-w-56 items-center gap-1.5 pr-1 pl-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
          >
            <TabLabel tab={tab} preview={preview} />
          </Link>
          <button
            type="button"
            aria-label={`Close ${tab.title}`}
            onClick={onClose}
            className="mr-1 flex size-6 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <XIcon aria-hidden className="size-3.5" />
          </button>
        </li>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem disabled={!preview} onSelect={onKeep}>
          Keep open
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={onClose}>Close</ContextMenuItem>
        <ContextMenuItem disabled={alone} onSelect={onCloseOthers}>
          Close other tabs
        </ContextMenuItem>
        <ContextMenuItem onSelect={onCloseAll}>Close all tabs</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
