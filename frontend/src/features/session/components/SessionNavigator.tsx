'use client'

import { useParams } from 'next/navigation'
import type { ReactNode } from 'react'

import { ErrorState, LoadingState } from '@/components/state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { useSessionThread } from '../hooks/useSessionThread'
import { SessionOutline } from './SessionOutline'

interface SessionNavigatorProps {
  projectId: string
  /** The list of the sessions of the project, shown in its own view. */
  sessions: ReactNode
}

/**
 * The side panel of the session, with two views: the outline of the session on screen, which goes
 * to each message or command of the user, and the list of the sessions of the project.
 */
export function SessionNavigator({ projectId, sessions }: SessionNavigatorProps) {
  const params = useParams<{ threadId?: string }>()
  const resolved = useSessionThread(projectId, params.threadId === undefined)
  const threadId = params.threadId ?? resolved.data

  return (
    <Tabs defaultValue="outline" className="gap-1">
      <TabsList className="mx-2">
        <TabsTrigger value="outline">Outline</TabsTrigger>
        <TabsTrigger value="sessions">Sessions</TabsTrigger>
      </TabsList>
      <TabsContent value="outline">
        {threadId !== undefined ? (
          <SessionOutline threadId={threadId} />
        ) : resolved.isError ? (
          <ErrorState
            message={resolved.error.message}
            onRetry={() => void resolved.refetch()}
            size="compact"
            className="px-3"
          />
        ) : (
          <LoadingState label="Loading the outline" rows={3} size="compact" className="px-3" />
        )}
      </TabsContent>
      <TabsContent value="sessions">{sessions}</TabsContent>
    </Tabs>
  )
}
