'use client'

import type { ComponentProps } from 'react'

import { Button } from '@/shared/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'

interface EntryActionProps extends Omit<ComponentProps<typeof Button>, 'aria-label'> {
  /** What the action does, for its tooltip and its name. */
  label: string
}

/** An action under an entry of the activity: an icon button, named by its tooltip. */
export function EntryAction({ label, children, ...props }: EntryActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={label} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
