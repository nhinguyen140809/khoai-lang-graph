'use client'

import { useEffect } from 'react'

import { runUiCommands } from '@/modules/activity/entities'
import { isUnfinishedRunStatus, type Run } from '@/modules/run/entities'
import type { Message } from '@/modules/thread/entities'

import { useAnswersStore } from '../stores/answers.store'

/**
 * Runs the commands of the answers that this page waits for, once each, as the answer arrives. A
 * run that is gone once the runs have loaded, or that ended with no answer, has none to wait for.
 */
export function useAnswerCommands({
  threadId,
  runs,
  messagesByRun,
  isLoaded,
}: {
  threadId: string | null
  runs: readonly Run[]
  messagesByRun: ReadonlyMap<string | null, readonly Message[]>
  isLoaded: boolean
}) {
  const watched = useAnswersStore((state) => state.watched)
  const unwatch = useAnswersStore((state) => state.unwatch)

  useEffect(() => {
    if (!isLoaded) return
    for (const [runId, watchedThreadId] of watched) {
      if (watchedThreadId !== threadId) continue
      const answer = messagesByRun.get(runId)?.find(({ author }) => author === 'agent')
      if (answer !== undefined) {
        runUiCommands(answer.commands, watchedThreadId)
        unwatch(runId)
      } else {
        // A run that is gone, or that ended with no answer, has none to wait for.
        const run = runs.find(({ id }) => id === runId)
        if (run === undefined || !isUnfinishedRunStatus(run.status)) unwatch(runId)
      }
    }
  }, [watched, threadId, runs, messagesByRun, isLoaded, unwatch])
}
