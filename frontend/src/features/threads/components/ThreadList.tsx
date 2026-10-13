'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { EmptyState, ErrorState, LoadingState } from '@/components/state'
import { Badge } from '@/components/ui/badge'
import { threadHref } from '@/lib/routes.utils'

import { useProjectThreads } from '../hooks/useProjectThreads'
import { threadTitle } from '../threads.utils'

interface ThreadListProps {
  projectId: string
}

/** The consoles of a project, newest first, each with the stage of its latest run. */
export function ThreadList({ projectId }: ThreadListProps) {
  const pathname = usePathname()
  const threads = useProjectThreads(projectId)

  if (threads.isPending) {
    return <LoadingState label="Loading consoles" rows={4} size="compact" className="px-3" />
  }

  if (threads.isError) {
    return (
      <ErrorState
        message={threads.error.message}
        onRetry={() => void threads.refetch()}
        size="compact"
        className="px-3"
      />
    )
  }

  if (threads.data.length === 0) {
    return <EmptyState title="No consoles yet" size="compact" className="px-3" />
  }

  return (
    <ul className="flex flex-col gap-px px-1 pb-2">
      {threads.data.map((thread) => {
        const href = threadHref(projectId, thread.id)
        const waiting = thread.active_run_status === 'interrupted'
        return (
          <li key={thread.id}>
            <Link
              href={href}
              aria-current={pathname === href ? 'page' : undefined}
              className="flex flex-col gap-0.5 rounded-md px-2 py-1.5 outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50 aria-[current=page]:bg-sidebar-accent"
            >
              <span className="flex items-center gap-2">
                <span className="truncate text-xs font-medium text-foreground">
                  {threadTitle(thread)}
                </span>
                {waiting && (
                  <>
                    <Badge aria-hidden variant="soft" color="warning" className="ml-auto">
                      1
                    </Badge>
                    <span className="sr-only">, 1 review waiting</span>
                  </>
                )}
              </span>
              <span className="truncate font-mono text-3xs text-muted-foreground">
                {thread.current_stage ?? 'No run yet'}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
