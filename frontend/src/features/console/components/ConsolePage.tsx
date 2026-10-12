'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { projectTabGroup } from '@/components/layout/activity-bar.config'
import { useEditorTab } from '@/components/layout/hooks/useEditorTab'
import { ErrorState, LoadingState } from '@/components/state'

import { useConsoleThread } from '../hooks/useConsoleThread'
import { Console } from './Console'

interface ConsolePageProps {
  projectId: string
  /** The console to show; without it, the console that the project has. */
  threadId?: string
  /** What follows the last event of the log; the review, when it is open. */
  afterLog?: ReactNode
  /** The review is open beside the console, so the console does not offer it. */
  reviewOpen?: boolean
}

/**
 * The console of a project: its event log and an input at the bottom. Without a console named,
 * the page resolves the thread that holds the console of the project, then renders it.
 */
export function ConsolePage({
  projectId,
  threadId,
  afterLog,
  reviewOpen = false,
}: ConsolePageProps) {
  const resolved = useConsoleThread(projectId, threadId === undefined)
  const pathname = usePathname()

  // The console in a review is a part of the tab of the review.
  useEditorTab(
    projectTabGroup(projectId),
    reviewOpen ? null : { id: 'console', title: 'Console', href: pathname, icon: 'console' },
  )

  if (threadId !== undefined) {
    return (
      <Console
        projectId={projectId}
        threadId={threadId}
        afterLog={afterLog}
        reviewOpen={reviewOpen}
      />
    )
  }

  if (resolved.isPending) {
    return <LoadingState label="Loading the console" />
  }

  if (resolved.isError) {
    return <ErrorState message={resolved.error.message} onRetry={() => void resolved.refetch()} />
  }

  return (
    <Console
      projectId={projectId}
      threadId={resolved.data}
      afterLog={afterLog}
      reviewOpen={reviewOpen}
    />
  )
}
