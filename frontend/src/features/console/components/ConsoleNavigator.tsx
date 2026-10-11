'use client'

import { useParams } from 'next/navigation'
import type { ReactNode } from 'react'

import { ErrorState, LoadingState } from '@/components/state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { useConsoleThread } from '../hooks/useConsoleThread'
import { ConsoleOutline } from './ConsoleOutline'

interface ConsoleNavigatorProps {
  projectId: string
  /** The list of the consoles of the project, shown in its own view. */
  consoles: ReactNode
}

/**
 * The side panel of the console, with two views: the outline of the console on screen, which goes
 * to each message or command of the user, and the list of the consoles of the project.
 */
export function ConsoleNavigator({ projectId, consoles }: ConsoleNavigatorProps) {
  const params = useParams<{ threadId?: string }>()
  const resolved = useConsoleThread(projectId, params.threadId === undefined)
  const threadId = params.threadId ?? resolved.data

  return (
    <Tabs defaultValue="outline" className="gap-1">
      <TabsList className="mx-2">
        <TabsTrigger value="outline">Outline</TabsTrigger>
        <TabsTrigger value="consoles">Consoles</TabsTrigger>
      </TabsList>
      <TabsContent value="outline">
        {threadId !== undefined ? (
          <ConsoleOutline threadId={threadId} />
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
      <TabsContent value="consoles">{consoles}</TabsContent>
    </Tabs>
  )
}
