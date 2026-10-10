'use client'

import { featureTabGroup } from '@/components/layout/activity-bar.config'
import { useEditorTab } from '@/components/layout/hooks/useEditorTab'

import { useProjectThreads } from '../hooks/useProjectThreads'
import { threadTitle } from '../threads.utils'

interface ThreadEditorTabProps {
  projectId: string
  threadId: string
}

/** Opens the editor tab of a thread, named after the thread. Renders nothing. */
export function ThreadEditorTab({ projectId, threadId }: ThreadEditorTabProps) {
  const threads = useProjectThreads(projectId)
  const thread = threads.data?.find(({ id }) => id === threadId)

  useEditorTab(
    featureTabGroup(projectId, 'chat'),
    threads.isPending
      ? null
      : {
          id: threadId,
          title: thread === undefined ? 'Thread' : threadTitle(thread),
          href: `/projects/${encodeURIComponent(projectId)}/chat/${encodeURIComponent(threadId)}`,
          icon: 'thread',
        },
  )

  return null
}
