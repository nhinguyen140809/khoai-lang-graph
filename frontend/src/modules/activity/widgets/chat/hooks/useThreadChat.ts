'use client'

import { useMemo } from 'react'

import { messagesByRun, useActivityStream, withLatestRun } from '@/modules/activity/entities'
import { usePendingInterrupt } from '@/modules/review/entities'
import { useLatestRun, useThreadRuns } from '@/modules/run/entities'
import { type Message, useThreadMessages } from '@/modules/thread/entities'

import { emptyMessages } from '../activity-chat.constants'
import { chatStateOf } from '../chat-state.utils'

/** The latest run of a thread, which the chat follows live, and the review that it waits for. */
function useRunOnScreen(threadId: string | null) {
  const latestRun = useLatestRun(threadId ?? '', { isEnabled: threadId !== null })
  const runOnScreen = latestRun.data ?? null
  useActivityStream(runOnScreen, threadId ?? '')
  const pendingReview =
    usePendingInterrupt(runOnScreen?.id ?? '', {
      isEnabled: runOnScreen !== null,
      runStatus: runOnScreen?.status,
    }).data ?? null
  return { latestRun, runOnScreen, pendingReview }
}

/**
 * What the chat of a thread shows: its runs in order, the messages of each run, the run on screen
 * with the review it waits for, and the state of the chat as a whole. It follows the stream of the
 * run on screen. A chat without a thread (`threadId` null) loads nothing.
 */
export function useThreadChat(threadId: string | null, hasThread: boolean) {
  const runs = useThreadRuns(threadId ?? '', { isEnabled: threadId !== null })
  const messages = useThreadMessages(threadId ?? '', { isEnabled: threadId !== null })
  const { latestRun, runOnScreen, pendingReview } = useRunOnScreen(threadId)

  const sortedRuns = withLatestRun(
    (runs.data?.pages ?? []).flatMap(({ items }) => items),
    latestRun.data,
  ).toSorted((a, b) => a.number - b.number)
  const byRun = useMemo(
    () =>
      messages.data === undefined
        ? new Map<string | null, Message[]>()
        : messagesByRun(messages.data.pages.flatMap(({ items }) => items)),
    [messages.data],
  )
  const state = chatStateOf({
    hasThread,
    isPending: runs.isPending || messages.isPending,
    isError: runs.isError || messages.isError,
    hasActivity: sortedRuns.length > 0 || (byRun.get(null) ?? emptyMessages).length > 0,
  })

  const retry = () => {
    void messages.refetch()
    void runs.refetch()
  }

  return { runs: sortedRuns, byRun, runOnScreen, pendingReview, state, retry }
}
