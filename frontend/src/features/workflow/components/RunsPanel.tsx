'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { EmptyState, ErrorState, LoadingState } from '@/components/state'
import { useNow } from '@/hooks/useNow'
import { formatRelativeTime } from '@/lib/relative-time.utils'
import { runStatusLabels, runStatusTones } from '@/lib/run-status.constants'
import { toneClasses } from '@/lib/tone.constants'
import { cn } from '@/lib/utils'

import { useProjectRuns } from '../hooks/useProjectRuns'
import { useRunSteps } from '../hooks/useRunSteps'
import { listSubjectKeys } from '../workflow.api'
import type { RunStep } from '../workflow.types'

interface RunsPanelProps {
  projectId: string
}

const rowClass =
  'flex min-w-0 items-center gap-2 rounded-sm px-2 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 hover:bg-sidebar-accent aria-[current=page]:bg-sidebar-accent'

/**
 * The steps of one run grouped the way skeletons §7 draws them: the single
 * steps by their node, and the turns of an interview — steps that work on
 * the same persona — as one row "4-27 PER-001".
 */
interface StepGroup {
  label: string
  range: string
  steps: RunStep[]
}

function groupSteps(steps: RunStep[], keys: Map<string, string>): StepGroup[] {
  const groups: StepGroup[] = []
  for (const step of steps) {
    const interview = step.node === 'interviewer' || step.node === 'persona_agent'
    const subject = step.subject_item_id
    if (interview && subject !== null) {
      const current = groups.at(-1)
      const lead = current?.steps.at(0)
      if (
        current !== undefined &&
        lead !== undefined &&
        lead.subject_item_id !== null &&
        lead.subject_item_id === subject
      ) {
        current.steps.push(step)
        current.range = `${String(lead.sequence)}-${String(step.sequence)}`
        continue
      }
      groups.push({
        label: keys.get(subject) ?? 'interview',
        range: String(step.sequence),
        steps: [step],
      })
      continue
    }
    groups.push({ label: step.node, range: String(step.sequence), steps: [step] })
  }
  return groups
}

/** The runs of the project's single conversation with their grouped steps. */
export function RunsPanel({ projectId }: RunsPanelProps) {
  const runs = useProjectRuns(projectId)
  const pathname = usePathname()
  const now = useNow()
  const activeRun = runs.data?.find((run) => pathname.endsWith(`/${encodeURIComponent(run.id)}`))
  const steps = useRunSteps(activeRun?.id ?? '')
  const keys = useQuery({
    queryKey: ['workflow', 'subject-keys', projectId],
    queryFn: () => listSubjectKeys(projectId),
  })

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
                Run {String(run.number)}: {runStatusLabels[run.status]}
              </span>
              {activeRun?.id === run.id ? null : (
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  step {String(run.step_count)}
                </span>
              )}
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
          {activeRun?.id === run.id && steps.data ? (
            <ol className="flex flex-col py-1 pl-3 text-xs text-muted-foreground">
              {groupSteps(steps.data, keys.data ?? new Map<string, string>()).map((group) => (
                <li
                  key={`${group.label}-${group.range}`}
                  className="flex gap-2 rounded-sm px-2 py-0.5"
                >
                  <span className="w-12 shrink-0 tabular-nums">{group.range}</span>
                  <span className="min-w-0 truncate font-mono">
                    {group.label}{' '}
                    {group.steps.length > 1
                      ? `  ${String(group.steps.length)} steps`
                      : (group.steps[0]?.status ?? '')}
                  </span>
                </li>
              ))}
            </ol>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
