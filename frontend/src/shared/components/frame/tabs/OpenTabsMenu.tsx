import { ChevronDownIcon } from 'lucide-react'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'

import type { EditorTab } from './editor-tabs.store'
import { TabLabel } from './TabLabel'

interface OpenTabsMenuProps {
  tabs: EditorTab[]
  onScreen: string | undefined
  previewId: string | undefined
  onCloseAll: () => void
}

/**
 * The button at the end of the strip: a menu of every open tab, for a strip too long to show them
 * all, then closing them all.
 */
export function OpenTabsMenu({ tabs, onScreen, previewId, onCloseAll }: OpenTabsMenuProps) {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="All open tabs"
          className="mx-1 flex size-8 shrink-0 items-center justify-center self-center rounded-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ChevronDownIcon aria-hidden className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {tabs.map((tab) => (
          <DropdownMenuItem
            key={tab.id}
            data-active={tab.id === onScreen}
            data-preview={tab.id === previewId}
            aria-current={tab.id === onScreen ? 'page' : undefined}
            onSelect={() => {
              router.push(tab.href as Route)
            }}
            className="group/tab"
          >
            <TabLabel tab={tab} preview={tab.id === previewId} />
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onCloseAll}>Close all tabs</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
