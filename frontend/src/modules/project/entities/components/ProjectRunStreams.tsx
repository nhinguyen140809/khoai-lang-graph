'use client'

import { useLatestRun } from '@/modules/run/entities/@x/project'
import { threadsWithUnfinishedRun, useProjectThreads } from '@/modules/thread/entities/@x/project'
import { pageItems } from '@/shared/api/query-client'

import { useProjectRunStream } from '../run-status/hooks/useProjectRunStream'

/**
 * Follows the event stream of the unfinished run of each thread of a project, so that what reads
 * the runs and the threads, such as the status of the project, follows them all. Renders nothing.
 */
export function ProjectRunStreams({ projectId }: { projectId: string }) {
  const threads = useProjectThreads(projectId)

  return threadsWithUnfinishedRun(pageItems(threads.data)).map(({ id }) => (
    <RunStream key={id} threadId={id} />
  ))
}

function RunStream({ threadId }: { threadId: string }) {
  const run = useLatestRun(threadId)
  useProjectRunStream(run.data)
  return null
}
