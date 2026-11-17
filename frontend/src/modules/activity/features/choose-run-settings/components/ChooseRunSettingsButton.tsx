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

interface ChooseRunSettingsButtonProps {
  thread: Thread | null
  /** Whether it reads as an icon and a label, or as the icon alone, named in a tooltip. */
  display?: 'full' | 'icon'
}

/** The item of the start side of the row under the prompt: it opens the dialog of the run settings. */
export function ChooseRunSettingsButton({
  thread,
  display = 'full',
}: ChooseRunSettingsButtonProps) {
  const chosen = useChosenRunSettings(thread?.id ?? null)
  const openRunSettings = useOpenRunSettingsDialog()
  const isDisabled = thread === null || hasUnfinishedRun(thread)
  const isIcon = display === 'icon'
  const reason =
    thread === null
      ? chooseRunSettingsMessages.noThread
      : isDisabled
        ? chooseRunSettingsMessages.inRun
        : null

  const button = (
    <Button
      variant="ghost"
      size={isIcon ? 'icon-sm' : 'sm'}
      className={isIcon ? undefined : 'px-1.5 text-sm'}
      aria-label={isIcon ? chooseRunSettingsMessages.button : undefined}
      disabled={isDisabled}
      onClick={() => {
        if (thread !== null) openRunSettings(thread.id)
      }}
    >
      <Settings2Icon aria-hidden />
      {!isIcon && chooseRunSettingsMessages.button}
      {chosen !== undefined && (
        <Badge variant="soft" aria-label={chooseRunSettingsMessages.changed}>
          {isIcon ? (
            <span className="sr-only">{chooseRunSettingsMessages.changed}</span>
          ) : (
            chooseRunSettingsMessages.changed
          )}
        </Badge>
      )}
    </Button>
  )

  return (
    <DisabledReason reason={reason}>
      {isIcon && reason === null ? (
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
