'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { ErrorState, LoadingState } from '@/components/state'
import { cn } from '@/lib/utils'

import { useCoverage } from '../hooks/useCoverage'
import { traceabilityHref } from '../traceability-links.utils'

const rowClassName =
  'flex min-w-0 items-center justify-between gap-2 rounded-md px-2 py-1 text-xs outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50 aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium'

/** The side panel: the gaps of the trace with their counts, and the views. */
export function TraceabilityNav({ projectId }: { projectId: string }) {
  const params = useSearchParams()
  const view = params.get('view')
  const gap = params.get('gap')
  const coverage = useCoverage(projectId)

  return (
    <nav aria-label="Traceability" className="flex flex-col gap-3 px-1 pb-2">
      <section aria-label="Coverage" className="flex flex-col gap-px">
        <h3 className="px-2 text-3xs font-medium tracking-wide text-muted-foreground uppercase">
          Coverage
        </h3>
        {coverage.isPending && <LoadingState label="Loading coverage" rows={3} size="compact" />}
        {coverage.isError && (
          <ErrorState
            message={coverage.error.message}
            onRetry={() => void coverage.refetch()}
            size="compact"
          />
        )}
        {coverage.data?.gaps.map((entry) => (
          <Link
            key={entry.key}
            href={traceabilityHref(projectId, { gap: entry.key }) as Route}
            title={entry.description}
            aria-current={view === null && gap === entry.key ? 'page' : undefined}
            className={rowClassName}
          >
            <span className="truncate">{entry.label}</span>
            <span className={cn('font-mono', entry.items.length > 0 && 'text-warning-strong')}>
              {entry.items.length}
            </span>
          </Link>
        ))}
      </section>
      <section aria-label="Views" className="flex flex-col gap-px">
        <h3 className="px-2 text-3xs font-medium tracking-wide text-muted-foreground uppercase">
          Views
        </h3>
        <Link
          href={traceabilityHref(projectId) as Route}
          aria-current={view === null && gap === null ? 'page' : undefined}
          className={rowClassName}
        >
          Matrix
        </Link>
        <Link
          href={traceabilityHref(projectId, { view: 'issues' }) as Route}
          aria-current={view === 'issues' ? 'page' : undefined}
          className={rowClassName}
        >
          Issues
        </Link>
      </section>
    </nav>
  )
}
