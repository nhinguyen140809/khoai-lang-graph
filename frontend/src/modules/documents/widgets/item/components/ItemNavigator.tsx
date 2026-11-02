'use client'

import { cn } from 'cn'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import type { OutlineNeighbors } from '@/modules/artifact/entities'
import { Button } from '@/shared/components/ui/button'
import { FloatingSurface } from '@/shared/components/ui/floating-surface'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import type { IdleHoldProps } from '@/shared/lib/timing'

import { itemPageMessages } from '../item-page.constants'

interface ItemNavigatorProps {
  neighbors: OutlineNeighbors
  isShown: boolean
  holdProps: IdleHoldProps
  onPrevious: () => void
  onNext: () => void
}

function NavigatorButton({
  label,
  hotkey,
  disabled,
  onClick,
  children,
}: {
  label: string
  hotkey: string
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          aria-keyshortcuts={hotkey}
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{`${label} (${hotkey})`}</TooltipContent>
    </Tooltip>
  )
}

/**
 * Previous and Next over the bottom right corner of the item page, with the place of the item among
 * the items of its document. Hidden, it fades out but stays in the page and in the order of Tab, so
 * the focus that reaches a button shows it again.
 */
export function ItemNavigator({
  neighbors,
  isShown,
  holdProps,
  onPrevious,
  onNext,
}: ItemNavigatorProps) {
  return (
    <FloatingSurface
      aria-label={itemPageMessages.navigator}
      role="group"
      corner="bottom-right"
      variant="glass"
      size="sm"
      className={cn(
        'flex items-center gap-1 rounded-lg border transition-opacity motion-reduce:transition-none',
        !isShown && 'pointer-events-none opacity-0',
      )}
      {...holdProps}
    >
      <NavigatorButton
        label={itemPageMessages.previous}
        hotkey="K"
        disabled={neighbors.previous === null}
        onClick={onPrevious}
      >
        <ChevronLeftIcon />
      </NavigatorButton>
      <span className="px-1 text-xs text-muted-foreground tabular-nums">
        {itemPageMessages.position(neighbors.index, neighbors.count)}
      </span>
      <NavigatorButton
        label={itemPageMessages.next}
        hotkey="J"
        disabled={neighbors.next === null}
        onClick={onNext}
      >
        <ChevronRightIcon />
      </NavigatorButton>
    </FloatingSurface>
  )
}
