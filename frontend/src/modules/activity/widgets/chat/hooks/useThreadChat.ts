'use client'

import { useEffect, useMemo } from 'react'

import {
  messagesByRun,
  useActivityStream,
  useAnswerPolling,
  withLatestRun,
} from '@/modules/activity/entities'
import { useAnswerCommands } from '@/modules/activity/features/answer-commands'
import { usePendingInterrupt } from '@/modules/review/entities'
import { isUnfinishedRunStatus, useLatestRun, useThreadRuns } from '@/modules/run/entities'
import { type Message, useThreadMessages } from '@/modules/thread/entities'

import { emptyMessages } from '../activity-chat.constants'
import type { OlderRuns } from '../chat-state.types'
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
 * run on screen. A chat without a thread (`threadId` null) loads nothing. The newest runs come
 * first, and the runs before them load on demand (`olderRuns`). The messages are in the order that
 * they were sent, so the newest are on the last page: the chat reads them to their end before it
 * shows the runs, or the latest runs would show without what was said in them.
 */
export function useThreadChat(threadId: string | null, hasThread: boolean) {
  const runs = useThreadRuns(threadId ?? '', { isEnabled: threadId !== null })
  const messages = useThreadMessages(threadId ?? '', { isEnabled: threadId !== null })
  const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = messages
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) void fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage])
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
    isPending: runs.isPending || messages.isPending || messages.hasNextPage,
    isError: runs.isError || messages.isError,
    hasActivity: sortedRuns.length > 0 || (byRun.get(null) ?? emptyMessages).length > 0,
  })

  // The run on screen is followed live. Any other run that works, such as the one that answers a
  // message, is not: while one works the chat loads again and again, and when its answer is there,
  // what the answer asks for is done.
  useAnswerPolling(
    sortedRuns.some((run) => isUnfinishedRunStatus(run.status) && run.id !== runOnScreen?.id),
  )
  useAnswerCommands({
    threadId,
    runs: sortedRuns,
    messagesByRun: byRun,
    isLoaded: !runs.isPending && !messages.isPending && !messages.hasNextPage,
  })

  const retry = () => {
    void messages.refetch()
    void runs.refetch()
  }

  const olderRuns: OlderRuns = {
    hasMore: runs.hasNextPage,
    isLoading: runs.isFetchingNextPage,
    isError: runs.isFetchNextPageError,
    load: () => {
      void runs.fetchNextPage()
    },
  }

  return { runs: sortedRuns, byRun, runOnScreen, pendingReview, state, retry, olderRuns }
}
