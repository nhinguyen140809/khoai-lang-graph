'use client'

import { PanelLeftIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/shared/components/ui/button'
import { Kbd, KbdGroup } from '@/shared/components/ui/kbd'
import { sidebarHotkey, useSidebar } from '@/shared/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { cn } from '@/shared/lib/cn'
import { ariaKeyShortcuts, hotkeyKeys, useModifierKeyName } from '@/shared/lib/hotkey'

import { sidebarMessages } from '../sidebar.constants'

interface SidebarToggleProps {
  className?: string
  /**
   * What the button shows while the side list is folded to its rail and the button is not pointed
   * at, such as the mark of the app. Pointing at it, or focusing it, fades the mark out and the icon
   * in, the way a row of the side list gives way to its action.
   */
  restingMark?: ReactNode
}

/**
 * The button that folds the side list to its rail and unfolds it again, or opens it over the page
 * on a narrow screen. Its tooltip gives the keys that do the same, named as on the keyboard of the
 * platform: Cmd on Apple devices, Ctrl elsewhere.
 */
export function SidebarToggle({ className, restingMark }: SidebarToggleProps) {
  const { open, openMobile, isMobile, toggleSidebar } = useSidebar()
  const modifier = useModifierKeyName()
  const isShown = isMobile ? openMobile : open
  const label = isShown ? sidebarMessages.hideSidebar : sidebarMessages.showSidebar
  const hasMark = restingMark !== undefined && !isShown

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn('group/toggle relative', className)}
          aria-expanded={isShown}
          aria-keyshortcuts={ariaKeyShortcuts(sidebarHotkey)}
          onClick={toggleSidebar}
        >
          <PanelLeftIcon
            aria-hidden
            className={cn(
              hasMark &&
                'scale-75 opacity-0 transition duration-base group-hover/toggle:scale-100 group-hover/toggle:opacity-100 group-focus-visible/toggle:scale-100 group-focus-visible/toggle:opacity-100 motion-reduce:transition-none',
            )}
          />
          {hasMark && (
            <span
              aria-hidden
              className="absolute inset-0 flex items-center justify-center transition duration-base group-hover/toggle:scale-75 group-hover/toggle:opacity-0 group-focus-visible/toggle:scale-75 group-focus-visible/toggle:opacity-0 motion-reduce:transition-none"
            >
              {restingMark}
            </span>
          )}
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" className="flex items-center gap-2">
        {label}
        <KbdGroup aria-hidden>
          {hotkeyKeys(sidebarHotkey, modifier).map((key) => (
            <Kbd key={key}>{key}</Kbd>
          ))}
        </KbdGroup>
      </TooltipContent>
    </Tooltip>
  )
}
