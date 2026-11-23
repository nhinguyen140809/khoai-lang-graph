'use client'

import { Settings2Icon } from 'lucide-react'

import { hasUnfinishedRun, type Thread } from '@/modules/thread/entities'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { DisabledReason } from '@/shared/components/ui/disabled-reason'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'

import { chooseRunSettingsMessages } from '../choose-run-settings.constants'
import { useChosenRunSettings } from '../hooks/useChosenRunSettings'
import { useOpenRunSettingsDialog } from '../hooks/useOpenRunSettingsDialog'

/**
 * How the button reads in each display: the record is the strategy, so that a new display is a new
 * entry, not a new branch in the component. `full` is an icon and a label; `icon` is the icon alone,
 * named in a tooltip.
 */
const displays = {
  full: {
    size: 'sm',
    className: 'px-1.5 text-sm',
    ariaLabel: undefined,
    label: chooseRunSettingsMessages.button,
    changedClassName: undefined,
    hasTooltip: false,
  },
  icon: {
    size: 'icon-sm',
    className: undefined,
    ariaLabel: chooseRunSettingsMessages.button,
    label: null,
    changedClassName: 'sr-only',
    hasTooltip: true,
  },
} as const

interface ChooseRunSettingsButtonProps {
  thread: Thread | null
  /** Whether it reads as an icon and a label, or as the icon alone, named in a tooltip. */
  display?: keyof typeof displays
}

/** Why the settings cannot be chosen now, in words; null while they can. */
function disabledReasonOf(thread: Thread | null): string | null {
  if (thread === null) return chooseRunSettingsMessages.noThread
  if (hasUnfinishedRun(thread)) return chooseRunSettingsMessages.inRun
  return null
}

/** The item of the start side of the row under the prompt: it opens the dialog of the run settings. */
export function ChooseRunSettingsButton({
  thread,
  display = 'full',
}: ChooseRunSettingsButtonProps) {
  const chosen = useChosenRunSettings(thread?.id ?? null)
  const openRunSettings = useOpenRunSettingsDialog()
  const reason = disabledReasonOf(thread)
  const isDisabled = reason !== null
  const look = displays[display]
  const button = (
    <Button
      variant="ghost"
      size={look.size}
      className={look.className}
      aria-label={look.ariaLabel}
      disabled={isDisabled}
      onClick={() => {
        if (thread !== null) openRunSettings(thread.id)
      }}
    >
      <Settings2Icon aria-hidden />
      {look.label}
      {chosen !== undefined && (
        <Badge variant="soft" aria-label={chooseRunSettingsMessages.changed}>
          <span className={look.changedClassName}>{chooseRunSettingsMessages.changed}</span>
        </Badge>
      )}
    </Button>
  )

  return (
    <DisabledReason reason={reason}>
      {look.hasTooltip && reason === null ? (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>{chooseRunSettingsMessages.button}</TooltipContent>
        </Tooltip>
      ) : (
        button
      )}
    </DisabledReason>
  )
}
