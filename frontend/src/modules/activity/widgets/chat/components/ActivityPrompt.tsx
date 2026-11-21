'use client'

import { type ReactNode, useRef, useState } from 'react'

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
import { useView, type View } from '@/shared/lib/view'
import { useFocusWhen } from '@/shared/lib/viewport'

import { activityChatMessages } from '../activity-chat.constants'
import { StageProgressBar } from './StageProgressBar'

interface FooterProps {
  projectId: string
  thread: Thread | null
  run: Run | null
}

/**
 * What each view puts in the row under the prompt. The developer view has the settings of the run
 * at the start, its progress being in the panel beside; the guided view shows the progress as a
 * bar of stages at the start and the settings as an icon at the end.
 */
const footers = {
  developer: ({ thread }) => ({ footerStart: <ChooseRunSettingsButton thread={thread} /> }),
  user: ({ projectId, thread, run }) => ({
    footerStart: <StageProgressBar run={run} projectId={projectId} />,
    footerEnd: <ChooseRunSettingsButton thread={thread} display="icon" />,
  }),
} satisfies Record<
  View,
  (props: FooterProps) => {
    footerStart?: ReactNode
    footerEnd?: ReactNode
  }
>

/** The prompt of the chat: it joins Send with the settings of the run the next message starts. */
export function ActivityPrompt({
  projectId,
  thread,
  run,
  shouldFocus = false,
  size = 'slim',
}: {
  projectId: string
  thread: Thread | null
  run: Run | null
  /** The empty state focuses the prompt, so that the first message can be typed at once. */
  shouldFocus?: boolean
  /** The box of the chat is slim, one row that grows with its send beside the text; a place can ask for another size. */
  size?: PromptInputSize
}) {
  const view = useView()
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // The prompt takes the focus as the chat opens, so that the next message can be typed at once.
  useFocusWhen(inputRef, shouldFocus)
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
      {...footers[view]({ projectId, thread, run })}
    />
  )
}
