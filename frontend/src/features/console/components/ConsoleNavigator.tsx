'use client'

import { useParams } from 'next/navigation'

import { SidePanelSection } from '@/frame'
import { ErrorState, LoadingState } from '@/shared/components/state'

import { useConsoleThread } from '../hooks/useConsoleThread'
import { ConsoleOutline } from './ConsoleOutline'

interface ConsoleNavigatorProps {
  projectId: string
}

/**
 * The side panel of the console. Each part is a section that collapses; today there is the
 * outline of the console on screen, which goes to each message or command of the user.
 */
export function ConsoleNavigator({ projectId }: ConsoleNavigatorProps) {
  const params = useParams<{ threadId?: string }>()
  const resolved = useConsoleThread(projectId, params.threadId === undefined)
  const threadId = params.threadId ?? resolved.data

  return (
    <div>
      <SidePanelSection title="Outline">
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
      </SidePanelSection>
    </div>
  )
}
