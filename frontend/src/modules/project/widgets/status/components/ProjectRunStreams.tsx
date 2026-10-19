'use client'

import { useRunStatusStream } from '@/modules/project/entities'
import { isUnfinishedRunStatus, useLatestRun } from '@/modules/run/entities'
import { useProjectThreads } from '@/modules/thread/entities'

/**
 * Follows the event stream of the unfinished run of each thread of a project, so that what reads
 * the runs and the threads, such as the status of the project, follows them all. Renders nothing.
 */
export function ProjectRunStreams({ projectId }: { projectId: string }) {
  const threads = useProjectThreads(projectId)

  return threads.data
    ?.filter(({ latest_run_status: status }) => status !== null && isUnfinishedRunStatus(status))
    .map(({ id }) => <RunStream key={id} threadId={id} />)
}

function RunStream({ threadId }: { threadId: string }) {
  const run = useLatestRun(threadId)
  useRunStatusStream(run.data)
  return null
}
