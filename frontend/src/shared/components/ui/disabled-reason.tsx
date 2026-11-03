'use client'

import type { ReactNode } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

interface DisabledReasonProps {
  /** Why the control is disabled; null leaves the control as it is. */
  reason: string | null
  /** The control, already disabled by the caller when `reason` is set. */
  children: ReactNode
}

/**
 * A disabled control with the reason in a tooltip. A disabled button takes no focus and no pointer,
 * so the tooltip sits on a wrapper that does (`tabIndex={0}`), which reads the reason as its
 * description for assistive technology.
 */
export function DisabledReason({ reason, children }: DisabledReasonProps) {
  if (reason === null) return children
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the wrapper stands in for the focus of the control, which cannot take it while disabled
          tabIndex={0}
          className="inline-flex rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  )
}
