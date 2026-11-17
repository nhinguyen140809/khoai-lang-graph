'use client'

import { PanelLeftIcon } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Kbd, KbdGroup } from '@/shared/components/ui/kbd'
import { sidebarHotkey, useSidebar } from '@/shared/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { ariaKeyShortcuts, hotkeyKeys, useModifierKeyName } from '@/shared/lib/hotkey'

import { sidebarMessages } from '../sidebar.constants'

/**
 * The button that folds the side list to its rail and unfolds it again, or opens it over the page
 * on a narrow screen. Its tooltip gives the keys that do the same, named as on the keyboard of the
 * platform: Cmd on Apple devices, Ctrl elsewhere.
 */
export function SidebarToggle({ className }: { className?: string }) {
  const { open, openMobile, isMobile, toggleSidebar } = useSidebar()
  const modifier = useModifierKeyName()
  const isShown = isMobile ? openMobile : open
  const label = isShown ? sidebarMessages.hideSidebar : sidebarMessages.showSidebar

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={className}
          aria-expanded={isShown}
          aria-keyshortcuts={ariaKeyShortcuts(sidebarHotkey)}
          onClick={toggleSidebar}
        >
          <PanelLeftIcon aria-hidden />
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
