'use client'

import { CheckIcon, CopyIcon } from 'lucide-react'
import type * as React from 'react'

import { useClipboard } from '@/shared/lib/clipboard'

import { Button } from './button'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

/** What the button shows: the icon, the words, or the icon with the words. */
type CopyDisplay = 'icon' | 'text' | 'icon-text'

interface CopyButtonProps extends Omit<
  React.ComponentProps<typeof Button>,
  'children' | 'asChild'
> {
  /** The text that a click copies. */
  value: string
  /** What the button shows: the icon, the words, or the icon with the words; the icon when left out. */
  display?: CopyDisplay
  /** The words of the button, which also name it when only the icon shows; "Copy" when left out. */
  label?: string
}

/**
 * A button that copies a text. While what it copied holds, it shows the check and the words
 * "Copied" in the success color, and two seconds later it goes back to copying. The icon alone
 * shows its label in a tooltip.
 */
function CopyButton({
  value,
  display = 'icon',
  label = 'Copy',
  variant = 'ghost',
  color,
  onClick,
  ...props
}: CopyButtonProps) {
  const { isCopied, copy } = useClipboard()

  const button = (
    <Button
      aria-label={display === 'icon' ? label : undefined}
      aria-live="polite"
      variant={variant}
      color={isCopied ? 'success' : color}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        copy(value)
      }}
      {...props}
    >
      {display !== 'text' && (isCopied ? <CheckIcon /> : <CopyIcon />)}
      {display !== 'icon' && (isCopied ? 'Copied' : label)}
    </Button>
  )

  if (display !== 'icon') return button
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export { CopyButton, type CopyDisplay }
