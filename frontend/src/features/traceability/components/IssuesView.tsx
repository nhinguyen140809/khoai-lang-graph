'use client'

import { CircleCheckIcon } from 'lucide-react'
import Link from 'next/link'

import { EmptyState, ErrorState, LoadingState } from '@/shared/components/state'
import { itemHref } from '@/shared/config/routes.utils'

import { useIssues } from '../hooks/useIssues'

function textOf(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/** The open ambiguity issues, conflicts and validation issues, with the items they are about. */
export function IssuesView({ projectId }: { projectId: string }) {
  const issues = useIssues(projectId)

  if (issues.isPending) return <LoadingState label="Loading the issues" rows={5} />
  if (issues.isError) {
    return <ErrorState message={issues.error.message} onRetry={() => void issues.refetch()} />
  }
  if (issues.data.every(({ entries }) => entries.length === 0)) {
    return (
      <EmptyState
        icon={CircleCheckIcon}
        title="No open issues"
        description="No ambiguity issue, conflict or validation issue is open."
      />
    )
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      {issues.data
        .filter(({ entries }) => entries.length > 0)
        .map((group) => (
          <section key={group.kind} aria-label={group.label} className="flex flex-col gap-2">
            <h2 className="text-xs font-medium">
              {group.label} <span className="text-muted-foreground">{group.entries.length}</span>
            </h2>
            <ul className="flex flex-col gap-2">
              {group.entries.map(({ issue, about }) => (
                <li key={issue.id} className="flex flex-col gap-1 rounded-md border p-3 text-xs">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <Link
                      href={itemHref(projectId, issue.id)}
                      className="font-mono text-primary underline-offset-2 hover:underline"
                    >
                      {issue.key}
                    </Link>
                    <span>{textOf(issue.content.description)}</span>
                  </div>
                  {about.length > 0 && (
                    <div className="flex flex-wrap gap-x-2 text-muted-foreground">
                      <span>About</span>
                      {about.map((item) => (
                        <Link
                          key={item.id}
                          href={itemHref(projectId, item.id)}
                          className="font-mono text-primary underline-offset-2 hover:underline"
                        >
                          {item.key}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  )
}
