'use client'

import { Settings2Icon } from 'lucide-react'

import { hasUnfinishedRun, type Thread } from '@/modules/thread/entities'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { DisabledReason } from '@/shared/components/ui/disabled-reason'

import { chooseRunSettingsMessages } from '../choose-run-settings.constants'
import { useChosenRunSettings } from '../hooks/useChosenRunSettings'
import { useOpenRunSettingsDialog } from '../hooks/useOpenRunSettingsDialog'

interface ChooseRunSettingsButtonProps {
  thread: Thread | null
}

/** Why the settings cannot be chosen now, in words; null while they can. */
function disabledReasonOf(thread: Thread | null): string | null {
  if (thread === null) return chooseRunSettingsMessages.noThread
  if (hasUnfinishedRun(thread)) return chooseRunSettingsMessages.inRun
  return null
}

/** The item of the start side of the row under the prompt: it opens the dialog of the run settings. */
export function ChooseRunSettingsButton({ thread }: ChooseRunSettingsButtonProps) {
  const chosen = useChosenRunSettings(thread?.id ?? null)
  const openRunSettings = useOpenRunSettingsDialog()
  const reason = disabledReasonOf(thread)
  const isDisabled = reason !== null

  return (
    <DisabledReason reason={reason}>
      <Button
        variant="ghost"
        size="sm"
        className="px-1.5 text-sm"
        disabled={isDisabled}
        onClick={() => {
          if (thread !== null) openRunSettings(thread.id)
        }}
      >
        <Settings2Icon aria-hidden />
        {chooseRunSettingsMessages.button}
        {chosen !== undefined && (
          <Badge variant="soft" aria-label={chooseRunSettingsMessages.changed}>
            {chooseRunSettingsMessages.changed}
          </Badge>
        )}
      </Button>
    </DisabledReason>
  )
}
