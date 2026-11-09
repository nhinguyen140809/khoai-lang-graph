'use client'

import type { LucideIcon } from 'lucide-react'
import type { Ref } from 'react'

import { Button } from './button'
import { ContextMenuItem } from './context-menu'
import { DisabledReason } from './disabled-reason'
import { DropdownMenuItem } from './dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

/**
 * What a menu needs to show one action of a feature: its icon, its words, why it cannot run now,
 * and what running does.
 */
export interface MenuAction {
  icon: LucideIcon
  label: string
  /** Why the action cannot run now, in words for a tooltip; null when it can run. */
  disabledReason: string | null
  /** The look of an action that removes something. */
  tone?: 'destructive' | undefined
  run: () => void
}

interface ActionMenuItemProps {
  icon: LucideIcon
  label: string
  /** Why the action cannot run now, in words for a tooltip; null when it can run. */
  disabledReason: string | null
  /** The look of an action that removes something. */
  tone?: 'destructive' | undefined
  onSelect: () => void
}

/** One action of a feature in a dropdown menu: its icon and its words, with the reason it cannot run now on hover and on focus. */
export function DropdownActionItem({
  icon: Icon,
  label,
  disabledReason,
  tone,
  onSelect,
}: ActionMenuItemProps) {
  return (
    <DisabledReason reason={disabledReason}>
      <DropdownMenuItem
        variant={tone === 'destructive' ? 'destructive' : 'default'}
        disabled={disabledReason !== null}
        onSelect={onSelect}
      >
        <Icon aria-hidden />
        {label}
      </DropdownMenuItem>
    </DisabledReason>
  )
}

/** One action of a feature in a context menu: its icon and its words, with the reason it cannot run now on hover and on focus. */
export function ContextActionItem({
  icon: Icon,
  label,
  disabledReason,
  tone,
  onSelect,
}: ActionMenuItemProps) {
  return (
    <DisabledReason reason={disabledReason}>
      <ContextMenuItem
        variant={tone === 'destructive' ? 'destructive' : 'default'}
        disabled={disabledReason !== null}
        onSelect={onSelect}
      >
        <Icon aria-hidden />
        {label}
      </ContextMenuItem>
    </DisabledReason>
  )
}

interface ActionIconButtonProps {
  action: MenuAction
  /** The size of the button; the small icon button when absent. */
  size?: 'icon' | 'icon-sm' | undefined
  ref?: Ref<HTMLButtonElement> | undefined
}

/**
 * One action of a feature as a quiet icon button: an icon alone, muted until it is hovered, that
 * says the words of the action in its tooltip and in its name for assistive technology. While the
 * action cannot run, the button is disabled and its tooltip gives the reason instead.
 */
export function ActionIconButton({
  action: { icon: Icon, label, disabledReason, run },
  size = 'icon-sm',
  ref,
}: ActionIconButtonProps) {
  const control = (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      size={size}
      className="text-muted-foreground"
      aria-label={label}
      disabled={disabledReason !== null}
      onClick={run}
    >
      <Icon aria-hidden />
    </Button>
  )

  if (disabledReason !== null)
    return <DisabledReason reason={disabledReason}>{control}</DisabledReason>
  return (
    <Tooltip>
      <TooltipTrigger asChild>{control}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
