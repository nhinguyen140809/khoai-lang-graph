'use client'

import { RunStatusBadge, useLatestRun, useRunStageLabel } from '@/modules/run/entities'
import type { Thread } from '@/modules/thread/entities'

import { projectRunStatusMessages, threadTitles } from '../project-run-status.constants'

// TODO: show the list from the status of the project once a project has several threads; with one
// thread, it only repeats the status, which opens the activity instead.
/** The threads of a project from the one that needs the user most, with the status of each. */
export function ThreadStatusList({ threads }: { threads: Thread[] }) {
  return (
    <div className="flex flex-col gap-1 py-2">
      <p className="px-3 text-sm font-semibold">{projectRunStatusMessages.overview}</p>
      {threads.length === 0 ? (
        <p className="px-3 text-sm text-muted-foreground">{projectRunStatusMessages.noThread}</p>
      ) : (
        <ul className="flex flex-col">
          {threads.map((thread) => (
            <ThreadStatusRow key={thread.id} thread={thread} />
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * A thread with the status of its latest run and, where the status names it, its stage; its title
 * comes first, on a line of its own, when the screens name the threads.
 */
function ThreadStatusRow({ thread }: { thread: Thread }) {
  const run = useLatestRun(thread.id)
  const stage = useRunStageLabel(
    thread.latest_run_status,
    thread.current_stage,
    run.data?.workflow_version,
  )

  return (
    <li className="flex min-w-0 flex-col gap-1 px-3 py-1.5">
      {threadTitles.shown && (
        <span className="truncate text-sm">
          {thread.title ?? projectRunStatusMessages.untitledThread}
        </span>
      )}
      <span className="flex min-w-0 items-center gap-2">
        <RunStatusBadge status={thread.latest_run_status} />
        {stage !== undefined && (
          <span className="truncate text-xs text-muted-foreground">{stage}</span>
        )}
      </span>
    </li>
  )
}
