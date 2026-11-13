'use client'

import { useEffect, useRef, useState } from 'react'

import {
  ChooseRunSettingsButton,
  useChosenRunSettings,
  useClearChosenRunSettings,
} from '@/modules/activity/features/choose-run-settings'
import { isUnfinishedRunStatus, type Run } from '@/modules/run/entities'
import { StopRunButton } from '@/modules/run/features/stop'
import type { Thread } from '@/modules/thread/entities'
import { useSendMessage } from '@/modules/thread/features/send-message'
import { PromptInput, type PromptInputSize, PromptSubmitButton } from '@/shared/components/prompt'
import { hasText } from '@/shared/lib/guards'

import { activityChatMessages } from '../activity-chat.constants'

/** The prompt of the chat: it joins Send with the settings of the run the next message starts. */
export function ActivityPrompt({
  projectId,
  thread,
  run,
  shouldFocus = false,
  size = 'compact',
}: {
  projectId: string
  thread: Thread | null
  run: Run | null
  /** The empty state focuses the prompt, so that the first message can be typed at once. */
  shouldFocus?: boolean
  /** The place makes its box slim while something else already fills the page, as a review that waits. */
  size?: PromptInputSize
}) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // The prompt takes the focus as the chat opens, so that the next message can be typed at once.
  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  useEffect(() => {
    if (shouldFocus) inputRef.current?.focus()
  }, [shouldFocus])
  const chosen = useChosenRunSettings(thread?.id ?? null)
  const clearChosen = useClearChosenRunSettings()
  const { send, isPending } = useSendMessage({ projectId, thread })
  const isBlank = !hasText(text)
  const isStoppable = run !== null && isUnfinishedRunStatus(run.status)

  return (
    <PromptInput
      size={size}
      label={activityChatMessages.prompt.label}
      value={text}
      onValueChange={setText}
      onSubmit={(content) => {
        send(content, {
          runConfig: chosen,
          onSent: () => {
            setText('')
            if (thread !== null) clearChosen(thread.id)
            // A click on Send takes the focus to the button; it goes back to the box.
            inputRef.current?.focus()
          },
        })
      }}
      submitLabel={activityChatMessages.prompt.send}
      keysHint={activityChatMessages.prompt.keys}
      placeholder={activityChatMessages.prompt.placeholder}
      isPending={isPending}
      inputRef={inputRef}
      endActions={
        isBlank && isStoppable ? (
          <StopRunButton run={run} display="icon" />
        ) : (
          <PromptSubmitButton
            submitLabel={activityChatMessages.prompt.send}
            isPending={isPending}
            isDisabled={isBlank}
          />
        )
      }
      footerStart={<ChooseRunSettingsButton thread={thread} />}
    />
  )
}
