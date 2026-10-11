'use client'

import { ErrorState, LoadingState } from '@/components/state'

import { useSessionThread } from '../hooks/useSessionThread'
import { Session } from './Session'

interface SessionPageProps {
  projectId: string
  /** The session to show; without it, the session that the project has. */
  threadId?: string
}

/**
 * The session of a project: its event log and an input at the bottom. Without a session named,
 * the page resolves the thread that holds the session of the project, then renders it.
 */
export function SessionPage({ projectId, threadId }: SessionPageProps) {
  const resolved = useSessionThread(projectId, threadId === undefined)

  if (threadId !== undefined) {
    return <Session projectId={projectId} threadId={threadId} />
  }

  if (resolved.isPending) {
    return <LoadingState label="Loading the session" />
  }

  if (resolved.isError) {
    return <ErrorState message={resolved.error.message} onRetry={() => void resolved.refetch()} />
  }

  return <Session projectId={projectId} threadId={resolved.data} />
}
