'use client'

import { cn } from 'cn'
import { cloneElement, isValidElement, type ReactNode } from 'react'

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

/** The icon of a tool in the rail, a size larger than the default of a button. */
function largeIcon(icon: ReactNode): ReactNode {
  return isValidElement<{ className?: string }>(icon)
    ? cloneElement(icon, { className: cn('size-5', icon.props.className) })
    : icon
}

/**
 * The button of a tool, which shows as pressed while the tool is open: its fill and its icon take
 * the primary color, so that it stands out from a button that is only pointed at.
 * @view user
 */
export function DeskToolButton({ tool, appearance }: DeskToolButtonProps) {
  const button = (
    <Button
      variant={tool.isActive ? 'soft' : 'ghost'}
      color={tool.isActive ? 'primary' : 'neutral'}
      size={appearance === 'icon' ? 'icon-lg' : 'sm'}
      aria-pressed={tool.isActive}
      onClick={tool.onSelect}
    >
      {appearance === 'icon' ? largeIcon(tool.icon) : tool.icon}
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
