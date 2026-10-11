'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { EmptyState, ErrorState, LoadingState } from '@/components/state'
import { useNow } from '@/hooks/useNow'
import { formatRelativeTime } from '@/lib/relative-time.utils'
import { runStatusLabels, runStatusTones } from '@/lib/run-status.constants'
import { toneClasses } from '@/lib/tone.constants'
import { cn } from '@/lib/utils'

import { useProjectRuns } from '../hooks/useProjectRuns'

interface RunsPanelProps {
  projectId: string
}

const rowClass =
  'flex min-w-0 items-center gap-2 rounded-sm px-2 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 hover:bg-sidebar-accent aria-[current=page]:bg-sidebar-accent'

/** The runs of the conversation, newest first: their state, stage, step count and time. */
export function RunsPanel({ projectId }: RunsPanelProps) {
  const runs = useProjectRuns(projectId)
  const pathname = usePathname()
  const now = useNow()

  if (runs.isPending) {
    return <LoadingState label="Loading runs" rows={3} className="px-2" />
  }
  if (runs.isError) {
    return (
      <ErrorState
        message={runs.error.message}
        onRetry={() => void runs.refetch()}
        className="px-2"
      />
    )
  }
  if (runs.data.length === 0) {
    return (
      <EmptyState
        title="No runs yet"
        description="The first message in Chat starts run 1."
        size="compact"
        className="px-2"
      />
    )
  }

  return (
    <ul className="flex flex-col gap-px px-1 py-2">
      {runs.data.map((run) => (
        <li key={run.id}>
          <Link
            href={`/projects/${encodeURIComponent(projectId)}/workflow/${encodeURIComponent(run.id)}`}
            aria-current={pathname.endsWith(`/${encodeURIComponent(run.id)}`) ? 'page' : undefined}
            className={cn(rowClass, 'flex-col items-start gap-0.5 text-sm')}
          >
            <span className="flex w-full items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  'size-2 shrink-0 rounded-full',
                  toneClasses[runStatusTones[run.status]],
                )}
              />
              <span className="min-w-0 truncate">
                Run {run.number}: {runStatusLabels[run.status]}
              </span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                step {run.step_count}
              </span>
            </span>
            <span className="flex w-full items-center gap-2 text-xs text-muted-foreground">
              <span className="min-w-0 truncate font-mono">{run.current_stage || '-'}</span>
              {run.finished_at ? (
                <time dateTime={run.finished_at} className="ml-auto shrink-0">
                  {formatRelativeTime(run.finished_at, now)}
                </time>
              ) : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
