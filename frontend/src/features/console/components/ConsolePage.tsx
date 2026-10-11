'use client'

import { ErrorState, LoadingState } from '@/components/state'

import { useConsoleThread } from '../hooks/useConsoleThread'
import { Console } from './Console'

interface ConsolePageProps {
  projectId: string
  /** The console to show; without it, the console that the project has. */
  threadId?: string
}

/**
 * The console of a project: its event log and an input at the bottom. Without a console named,
 * the page resolves the thread that holds the console of the project, then renders it.
 */
export function ConsolePage({ projectId, threadId }: ConsolePageProps) {
  const resolved = useConsoleThread(projectId, threadId === undefined)

  if (threadId !== undefined) {
    return <Console projectId={projectId} threadId={threadId} />
  }

  if (resolved.isPending) {
    return <LoadingState label="Loading the console" />
  }

  if (resolved.isError) {
    return <ErrorState message={resolved.error.message} onRetry={() => void resolved.refetch()} />
  }

  return <Console projectId={projectId} threadId={resolved.data} />
}
