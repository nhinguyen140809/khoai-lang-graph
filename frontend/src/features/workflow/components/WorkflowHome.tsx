'use client'

import { NetworkIcon } from 'lucide-react'
import Link from 'next/link'

import { EmptyState, ErrorState, LoadingState } from '@/shared/components/state'
import { Button } from '@/shared/components/ui/button'
import { routes } from '@/shared/config/routes'

import { useProjectRuns } from '../hooks/useProjectRuns'

/** What the workflow shows before a run is chosen: a way to the newest run. */
export function WorkflowHome({ projectId }: { projectId: string }) {
  const runs = useProjectRuns(projectId)

  if (runs.isPending) return <LoadingState label="Loading the runs" />
  if (runs.isError) {
    return <ErrorState message={runs.error.message} onRetry={() => void runs.refetch()} />
  }
  const newest = runs.data[0]
  if (newest === undefined) {
    return (
      <EmptyState
        icon={NetworkIcon}
        title="No runs yet"
        description="A run appears here after the first message of the console starts it."
      />
    )
  }
  return (
    <EmptyState
      icon={NetworkIcon}
      title="Choose a run"
      description="Choose a run in the side panel to see its workflow: the graph, the state of each node and the steps."
      action={
        <Button asChild>
          <Link href={routes.project(projectId).run(newest.id)}>Open Run {newest.number}</Link>
        </Button>
      }
    />
  )
}
