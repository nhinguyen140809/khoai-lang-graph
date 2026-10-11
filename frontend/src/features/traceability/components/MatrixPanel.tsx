'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { ErrorState, LoadingState } from '@/components/state'
import { Switch } from '@/components/ui/switch'

import { useProjectTrace } from '../hooks/useTraceability'

interface MatrixPanelProps {
  projectId: string
}

const gapEntries = [
  { key: 'backlog', label: 'No backlog item' },
  { key: 'spec', label: 'No source' },
  { key: 'analyzed', label: 'Needs review' },
] as const

/**
 * The side panel of the Traceability tab: the coverage counts from the
 * coverage endpoint (a click filters the matrix to that gap), the
 * "only rows with a gap" switch, and the open issues of the project.
 */
export function MatrixPanel({ projectId }: MatrixPanelProps) {
  const { coverage, items } = useProjectTrace(projectId)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const onlyGaps = searchParams.get('gaps') === '1'

  if (coverage.isPending || items.isPending) {
    return <LoadingState label="Loading coverage" rows={4} className="px-2" />
  }
  if (coverage.isError) {
    return (
      <ErrorState
        message={coverage.error.message}
        onRetry={() => void coverage.refetch()}
        className="px-2"
      />
    )
  }
  if (items.isError) {
    return (
      <ErrorState
        message={items.error.message}
        onRetry={() => void items.refetch()}
        className="px-2"
      />
    )
  }

  const counts = {
    backlog: coverage.data.no_backlog_item.count,
    spec: coverage.data.no_source.count,
    analyzed: coverage.data.needs_review.count,
  }
  const issues = items.data.filter(
    (item) =>
      item.kind === 'ambiguity_issue' ||
      item.kind === 'conflict' ||
      item.kind === 'validation_issue',
  )

  return (
    <div className="flex flex-col gap-4 px-2 py-3 text-sm">
      <section aria-labelledby="coverage-heading" className="flex flex-col gap-1">
        <h2
          id="coverage-heading"
          className="text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase"
        >
          Coverage
        </h2>
        <ul className="flex flex-col">
          {gapEntries.map(({ key, label }) => (
            <li key={key}>
              <Link
                href={`/projects/${encodeURIComponent(projectId)}/traceability?gap=${key}`}
                aria-current={searchParams.get('gap') === key ? 'page' : undefined}
                className="flex min-w-0 items-center gap-2 rounded-sm px-2 py-1 outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50 aria-[current=page]:bg-sidebar-accent"
              >
                {counts[key] === 0 ? null : (
                  <span
                    aria-hidden
                    className="size-1.5 shrink-0 rounded-full bg-(--tone-warning-strong)"
                  />
                )}
                <span className="min-w-0 truncate text-muted-foreground">{label}</span>
                <span className="ml-auto shrink-0 tabular-nums">{counts[key]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <div className="flex items-center justify-between gap-2 px-2">
        <label htmlFor="only-gaps" className="cursor-pointer text-muted-foreground">
          Only rows with a gap
        </label>
        <Switch
          id="only-gaps"
          checked={onlyGaps}
          onCheckedChange={(checked) => {
            const base = pathname.replace(/\?gaps=1$/, '')
            const href = checked ? `${base}?gaps=1` : base
            router.replace(href as Route)
          }}
        />
      </div>
      <section aria-labelledby="issues-heading" className="flex flex-col gap-1">
        <h2
          id="issues-heading"
          className="text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase"
        >
          Issues
        </h2>
        {issues.length === 0 ? (
          <p className="px-2 text-muted-foreground">None open.</p>
        ) : (
          <ul className="flex flex-col">
            {issues.map((issue) => (
              <li key={issue.id}>
                <Link
                  href={`/projects/${encodeURIComponent(projectId)}/search/${encodeURIComponent(issue.id)}`}
                  className="flex min-w-0 items-center gap-2 rounded-sm px-2 py-1 outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <span className="shrink-0 font-mono text-xs">{issue.key}</span>
                  <span className="min-w-0 truncate text-xs text-muted-foreground">
                    {issue.kind}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
