'use client'

import { type ReactNode, useRef } from 'react'
import { toast } from 'sonner'

import { runUiCommands } from '@/modules/activity/entities'
import {
  ChooseRunSettingsButton,
  useChosenRunSettings,
  useClearChosenRunSettings,
} from '@/modules/activity/features/choose-run-settings'
import { isUnfinishedRunStatus, type Run } from '@/modules/run/entities'
import { StopRunButton } from '@/modules/run/features/stop'
import { AttachedSources, PickSourceItem, useUploadSources } from '@/modules/source/features/upload'
import type { Thread } from '@/modules/thread/entities'
import { useSendMessage } from '@/modules/thread/features/send-message'
import { dictationProblemMessage } from '@/shared/components/dictation'
import {
  PromptAddMenu,
  PromptAttachments,
  PromptBar,
  PromptBarEnd,
  PromptBox,
  PromptDictation,
  PromptDictationProvider,
  PromptFooter,
  PromptFooterEnd,
  PromptFooterStart,
  PromptInput,
  type PromptInputSize,
  PromptListeningGlow,
  PromptSend,
  PromptTextarea,
  usePromptDraft,
} from '@/shared/components/prompt'
import { hasText } from '@/shared/lib/guards'
import { useView, type View } from '@/shared/lib/view'
import { useFocusWhen } from '@/shared/lib/viewport'

import { activityChatMessages } from '../../activity-chat.constants'
import { StageProgressBar } from './StageProgressBar'

interface FooterProps {
  projectId: string
  thread: Thread | null
  run: Run | null
}

/**
 * What each view puts in the row under the prompt. The developer view has the settings of the run
 * at the start, its progress being in the panel beside; the guided view shows the progress as a
 * bar of stages, and has the settings in the bar of the desk (`ChatSettingsBarItem`).
 */
const footers: Record<
  View,
  (props: FooterProps) => { footerStart?: ReactNode; footerEnd?: ReactNode }
> = {
  developer: ({ thread }) => ({ footerStart: <ChooseRunSettingsButton thread={thread} /> }),
  user: ({ projectId, run }) => ({
    footerStart: <StageProgressBar run={run} projectId={projectId} />,
  }),
}

/** The prompt of the chat: it joins Send with the settings of the run the next message starts, and its plus uploads sources to the project. */
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
  // The draft is kept for the chat of the project, so that it is there again when the page loads.
  const [text, setText] = usePromptDraft(`chat:${projectId}`)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // The prompt takes the focus as the chat opens, so that the next message can be typed at once.
  useFocusWhen(inputRef, shouldFocus)
  const chosen = useChosenRunSettings(thread?.id ?? null)
  const clearChosen = useClearChosenRunSettings()
  const { send, isPending } = useSendMessage({ projectId, thread })
  // Kept here, not in the menu, so that an upload goes on after the menu has closed.
  const upload = useUploadSources(projectId)
  const isBlank = !hasText(text)
  const isStoppable = run !== null && isUnfinishedRunStatus(run.status)

  const { footerStart, footerEnd } = footers[view]({ projectId, thread, run })

  return (
    <PromptInput
      size={size}
      label={activityChatMessages.prompt.label}
      value={text}
      onValueChange={setText}
      onSubmit={(content) => {
        send(content, {
          runConfig: chosen,
          onCommands: runUiCommands,
          onSent: () => {
            setText('')
            if (thread !== null) clearChosen(thread.id)
            // A click on Send takes the focus to the button; it goes back to the box.
            inputRef.current?.focus()
          },
        })
      }}
      keysHint={activityChatMessages.prompt.keys}
      isPending={isPending}
      inputRef={inputRef}
    >
      <PromptDictationProvider
        onProblem={(problem) => {
          toast.error(dictationProblemMessage(problem))
        }}
      >
        <PromptBox behind={<PromptListeningGlow />}>
          {/* The files show while they go up, so that the wait has something to look at. */}
          <PromptAttachments isPresent={upload.isPending}>
            <AttachedSources files={upload.variables ?? []} state="uploading" />
          </PromptAttachments>
          <PromptTextarea placeholder={activityChatMessages.prompt.placeholder} />
          <PromptBar>
            <PromptBarEnd>
              {isBlank && isStoppable ? (
                <StopRunButton run={run} display="icon" />
              ) : (
                <PromptSend label={activityChatMessages.prompt.send} />
              )}
            </PromptBarEnd>
          </PromptBar>
        </PromptBox>
        <PromptFooter>
          <PromptFooterStart>{footerStart}</PromptFooterStart>
          <PromptFooterEnd>
            <PromptAddMenu>
              <PickSourceItem onPick={upload.mutate} />
            </PromptAddMenu>
            <PromptDictation />
            {footerEnd}
          </PromptFooterEnd>
        </PromptFooter>
      </PromptDictationProvider>
    </PromptInput>
  )
}
