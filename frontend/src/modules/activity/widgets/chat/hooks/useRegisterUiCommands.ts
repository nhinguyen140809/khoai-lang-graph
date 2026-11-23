'use client'

import { uiCommandIds, useRevealReference } from '@/modules/activity/entities'
import { useOpenRunSettingsDialog } from '@/modules/activity/features/choose-run-settings'
import type { Thread } from '@/modules/thread/entities'
import { useCommands } from '@/shared/lib/commands'

import { activityChatMessages } from '../activity-chat.constants'

interface UiCommandTargets {
  /** The thread of the chat, for a command that does not say which one it acts on. */
  thread: Thread | null
  /** Brings the review that waits into view. */
  showReview: () => void
  /** Whether a review waits, so that the palette lists the command that goes to it. */
  hasReview: boolean
}

/** The commands that open a document or an item beside the chat; they ask for a record to open. */
function useOpenReferenceCommands() {
  const reveal = useRevealReference()

  useCommands([
    {
      id: uiCommandIds.openDocument,
      run: ({ artifact_id: artifactId, label }) => {
        if (artifactId != null) reveal({ kind: 'document', artifactId }, label ?? '')
      },
    },
    {
      id: uiCommandIds.openItem,
      run: ({ item_id: itemId, label }) => {
        if (itemId != null) reveal({ kind: 'item', itemId }, label ?? '')
      },
    },
  ])
}

/** The command that brings the review that waits into view, listed while a review waits. */
function useOpenReviewCommand({ showReview, hasReview }: Omit<UiCommandTargets, 'thread'>) {
  useCommands([
    {
      id: uiCommandIds.openReview,
      ...(hasReview && {
        label: activityChatMessages.commands.openReview,
        group: activityChatMessages.commands.group,
      }),
      run: showReview,
    },
  ])
}

/** The command that opens the run settings of a thread, listed while the chat has a thread. */
function useOpenSettingsCommand(thread: Thread | null) {
  const openRunSettings = useOpenRunSettingsDialog()

  useCommands([
    {
      id: uiCommandIds.openSettings,
      ...(thread !== null && {
        label: activityChatMessages.commands.openSettings,
        group: activityChatMessages.commands.group,
      }),
      run: ({ thread_id: threadId }) => {
        const target = threadId ?? thread?.id
        if (target != null) openRunSettings(target)
      },
    },
  ])
}

/**
 * Registers what the chat can do for an answer that asks the page to do something: open a document
 * or an item beside it, its settings, or its review. A command that names a record it lacks does
 * nothing. The commands that make sense without an answer, the settings and the review, are also
 * in the command palette.
 */
export function useRegisterUiCommands({ thread, showReview, hasReview }: UiCommandTargets) {
  useOpenReferenceCommands()
  useOpenReviewCommand({ showReview, hasReview })
  useOpenSettingsCommand(thread)
}
