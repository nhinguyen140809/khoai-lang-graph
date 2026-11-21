'use client'

import { Button } from '@/shared/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'

import type { DeskTool } from '../desk-tool.types'

interface DeskToolButtonProps {
  tool: Pick<DeskTool, 'label' | 'icon' | 'isActive' | 'onSelect'>
  /**
   * `named` shows the name beside the icon, and on a narrow screen the icon alone; `icon` shows the
   * icon alone, with the name in a tooltip.
   */
  appearance: 'named' | 'icon'
}

/** The button of a tool, which shows as pressed while the tool is open. */
export function DeskToolButton({ tool, appearance }: DeskToolButtonProps) {
  const button = (
    <Button
      variant="ghost"
      size={appearance === 'icon' ? 'icon-sm' : 'sm'}
      aria-pressed={tool.isActive}
      onClick={tool.onSelect}
      className="aria-pressed:bg-muted"
    >
      {tool.icon}
      <span className={appearance === 'icon' ? 'sr-only' : 'max-sm:sr-only'}>{tool.label}</span>
    </Button>
  )
  if (appearance === 'named') return button

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="left">{tool.label}</TooltipContent>
    </Tooltip>
  )
}
