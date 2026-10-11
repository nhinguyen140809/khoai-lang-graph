'use client'

import type { Route } from 'next'
import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { ErrorState, LoadingState } from '@/components/state'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useHotkey } from '@/hooks/useHotkey'
import { useNow } from '@/hooks/useNow'

import { useCommandHistoryStore } from '../command-history.store'
import type { CommandName } from '../commands.constants'
import { followLog, isFollowingLog } from '../event-scroll.utils'
import { useRetryRun, useSendMessage, useStopRun } from '../hooks/useConsoleActions'
import { useEventLog } from '../hooks/useEventLog'
import { ConsoleInput } from './ConsoleInput'
import { EventLine } from './EventLine'
import { ReviewLine } from './ReviewLine'
import { RunWatcher } from './RunWatcher'

interface ConsoleProps {
  projectId: string
  threadId: string
  /** What follows the last event of the log; the review, when it is open. */
  afterLog?: ReactNode
  /** The review is open beside the console, so the console does not offer it. */
  reviewOpen?: boolean
}

/**
 * The console of a project: the event log of its runs, printed row by row as the events happen,
 * and an input at the bottom for a message that starts a run or a command.
 */
export function Console({ projectId, threadId, afterLog, reviewOpen = false }: ConsoleProps) {
  const router = useRouter()
  const eventLog = useEventLog(threadId)
  const { activeRun, latestRun, stepsByRun } = eventLog
  const sendMessage = useSendMessage(threadId)
  const stopRun = useStopRun()
  const retryRun = useRetryRun()
  const recordCommand = useCommandHistoryStore((state) => state.record)
  const [expandAll, setExpandAll] = useState(false)
  const now = useNow(activeRun === null ? 60_000 : 1000).getTime()
  const endRef = useRef<HTMLDivElement>(null)

  useHotkey(
    'o',
    () => {
      setExpandAll((previous) => !previous)
    },
    { mod: true },
  )

  // The review opens by itself when a run that was running stops at a checkpoint.
  const previousStatus = useRef(activeRun?.status)
  useEffect(() => {
    const status = activeRun?.status
    if (!reviewOpen && previousStatus.current === 'running' && status === 'interrupted') {
      router.push(
        `/projects/${encodeURIComponent(projectId)}/review/${encodeURIComponent(activeRun?.id ?? '')}` as Route,
      )
    }
    previousStatus.current = status
  }, [activeRun?.id, activeRun?.status, projectId, reviewOpen, router])

  useEffect(() => {
    // A console opens at its newest row.
    followLog(true)
  }, [threadId])

  useEffect(() => {
    // Keep the newest row in view while the log grows, unless the reader went to an earlier one.
    if (isFollowingLog()) endRef.current?.scrollIntoView({ block: 'end' })
  }, [eventLog.log.length, activeRun?.status])

  const failedStep =
    latestRun?.status === 'failed'
      ? (stepsByRun[latestRun.id]?.findLast(({ status }) => status === 'failed') ??
        stepsByRun[latestRun.id]?.at(-1))
      : undefined

  const commandReasons: Record<CommandName, string | null> = {
    stop: activeRun === null ? 'no run to stop' : null,
    retry: failedStep === undefined ? 'no failed run' : null,
    expand: null,
    collapse: null,
    export: null,
  }

  const runCommand = (name: CommandName) => {
    followLog(true)
    recordCommand(threadId, name)
    switch (name) {
      case 'stop':
        if (activeRun !== null) stopRun.mutate(activeRun.id)
        return
      case 'retry':
        if (latestRun !== null && failedStep !== undefined) {
          retryRun.mutate({ runId: latestRun.id, stepId: failedStep.id })
        }
        return
      case 'expand':
        setExpandAll(true)
        return
      case 'collapse':
        setExpandAll(false)
        return
      case 'export':
        router.push(`/projects/${encodeURIComponent(projectId)}/artifacts?export` as Route)
        return
    }
  }

  if (eventLog.isPending) {
    return <LoadingState label="Loading the console" />
  }
  if (eventLog.error !== null) {
    return <ErrorState message={eventLog.error.message} onRetry={eventLog.refetch} />
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div role="log" aria-label="Event log" className="mx-auto flex max-w-3xl flex-col p-4">
          {eventLog.log.length === 0 && (
            <p className="font-mono text-xs text-muted-foreground">
              No events yet. Describe what to build to start the first run.
            </p>
          )}
          {eventLog.log.map((event) => (
            <EventLine
              key={event.id}
              event={event}
              projectId={projectId}
              expandAll={expandAll}
              now={now}
            />
          ))}
          {activeRun !== null && <RunWatcher key={activeRun.id} runId={activeRun.id} />}
          {activeRun?.status === 'interrupted' && !reviewOpen && (
            <ReviewLine projectId={projectId} runId={activeRun.id} />
          )}
          {afterLog}
          <div ref={endRef} />
        </div>
      </ScrollArea>
      <ConsoleInput
        projectId={projectId}
        commandReasons={commandReasons}
        canSend={activeRun === null}
        onSend={(text) => {
          followLog(true)
          return sendMessage.mutateAsync(text)
        }}
        onCommand={runCommand}
        canStop={activeRun !== null}
        expandAll={expandAll}
      />
    </div>
  )
}
