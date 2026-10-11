import { useQueries, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'

import { rehydrateCommandHistory, useCommandHistoryStore } from '../command-history.store'
import { buildEventLog } from '../event-log.utils'
import { listMessages, listRunSteps, listThreadRuns } from '../session.api'
import type { SessionRun, SessionStep } from '../session.types'
import { sessionKeys } from '../session-keys.constants'

const UNFINISHED = new Set<SessionRun['status']>(['queued', 'running', 'interrupted'])

/** The messages, the runs and the steps of the session, and the event log that they make. */
export function useEventLog(threadId: string) {
  const commands = useCommandHistoryStore((state) => state.commands[threadId])
  useEffect(() => {
    // The commands are read after the first render, so that it matches the server HTML.
    rehydrateCommandHistory()
  }, [])
  const messages = useQuery({
    queryKey: sessionKeys.messages(threadId),
    queryFn: () => listMessages(threadId),
  })
  const runs = useQuery({
    queryKey: sessionKeys.runs(threadId),
    queryFn: () => listThreadRuns(threadId),
  })
  const stepQueries = useQueries({
    queries: (runs.data ?? []).map((run) => ({
      queryKey: sessionKeys.steps(run.id),
      queryFn: () => listRunSteps(run.id),
    })),
  })

  const stepsByRun: Record<string, SessionStep[] | undefined> = {}
  stepQueries.forEach((query, index) => {
    const run = runs.data?.[index]
    if (run !== undefined) stepsByRun[run.id] = query.data
  })
  const stepsError = stepQueries.find((query) => query.isError)?.error
  const stepsPending = stepQueries.some((query) => query.isPending)
  const stepsKey = stepQueries.map((query) => query.dataUpdatedAt).join(',')

  const log = useMemo(
    () =>
      messages.data === undefined || runs.data === undefined
        ? []
        : buildEventLog({ messages: messages.data, commands, runs: runs.data, stepsByRun }),
    // `stepsByRun` is rebuilt on every render; the update times say when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages.data, commands, runs.data, stepsKey],
  )

  const activeRun = runs.data?.find(({ status }) => UNFINISHED.has(status)) ?? null
  const latestRun = runs.data?.[0] ?? null

  return {
    log,
    activeRun,
    latestRun,
    stepsByRun,
    isPending: messages.isPending || runs.isPending || stepsPending,
    error: messages.error ?? runs.error ?? stepsError ?? null,
    refetch: () => {
      void messages.refetch()
      void runs.refetch()
      stepQueries.forEach((query) => void query.refetch())
    },
  }
}
