'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { ErrorState, LoadingState } from '@/components/state'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

import { useProjectTrace } from '../hooks/useTraceability'
import { buildMatrix } from '../traceability.utils'

interface MatrixPanelProps {
  projectId: string
}

const gapLabels = {
  backlog: 'Backlog item without a spec',
  spec: 'Spec without a backlog item',
  analyzed: 'Analyzed without a spec',
  source: 'Source without an analysis',
} as const

/**
 * The side panel of the Traceability tab: the coverage counts (a click filters
 * the matrix to the rows with that gap), the "only rows with a gap" switch,
 * and the open issues of the project.
 */
export function MatrixPanel({ projectId }: MatrixPanelProps) {
  const { links, items } = useProjectTrace(projectId)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const onlyGaps = searchParams.get('gaps') === '1'

  if (links.isPending || items.isPending) {
    return <LoadingState label="Loading coverage" rows={4} className="px-2" />
  }
  if (links.isError) {
    return (
      <ErrorState
        message={links.error.message}
        onRetry={() => void links.refetch()}
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

  const { gaps, issues } = buildMatrix(links.data, items.data)

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
          {Object.entries(gapLabels).map(([gap, label]) => (
            <li key={gap}>
              <Link
                href={`/projects/${encodeURIComponent(projectId)}/traceability?gap=${gap}`}
                aria-current={searchParams.get('gap') === gap ? 'page' : undefined}
                className="flex min-w-0 items-center gap-2 rounded-sm px-2 py-1 outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50 aria-[current=page]:bg-sidebar-accent"
              >
                {gaps[gap as keyof typeof gaps] === 0 ? null : (
                  <span
                    aria-hidden
                    className="size-1.5 shrink-0 rounded-full bg-(--tone-warning-strong)"
                  />
                )}
                <span className="min-w-0 truncate text-muted-foreground">{label}</span>
                <span className="ml-auto shrink-0 tabular-nums">
                  {gaps[gap as keyof typeof gaps]}
                </span>
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
                  className={cn(
                    'flex min-w-0 items-center gap-2 rounded-sm px-2 py-1 outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50',
                  )}
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
