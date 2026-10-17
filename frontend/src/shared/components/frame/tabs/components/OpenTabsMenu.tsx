import { ChevronDownIcon } from 'lucide-react'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'

import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'

import { useTabStrip } from '../hooks/useTabStrip'
import { TabLabel } from './TabLabel'

/**
 * The button at the end of the strip: a menu of every open tab, for a strip too long to show them
 * all, then closing them all.
 */
export function OpenTabsMenu() {
  const router = useRouter()
  const { tabs, onScreen, previewId, close } = useTabStrip()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="All open tabs"
          className="mx-1 self-center text-muted-foreground"
        >
          <ChevronDownIcon aria-hidden />
        </Button>
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
        <DropdownMenuItem
          onSelect={() => {
            close(tabs.map(({ id }) => id))
          }}
        >
          Close all tabs
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
