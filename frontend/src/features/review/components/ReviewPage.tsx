'use client'

import { useRouter } from 'next/navigation'
import type { ComponentType, ReactNode } from 'react'

import { projectTabGroup } from '@/components/layout/activity-bar.config'
import { useEditorTabsStore } from '@/components/layout/editor-tabs.store'
import { useEditorTab } from '@/components/layout/hooks/useEditorTab'
import { surfaceClassName } from '@/components/layout/surface.config'
import { EmptyState, ErrorState, LoadingState } from '@/components/state'
import { Button } from '@/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { cn } from '@/lib/utils'

import { usePendingInterrupt } from '../hooks/usePendingInterrupt'
import { ReviewCard } from './ReviewCard'

interface ReviewPageProps {
  projectId: string
  runId: string
  /** The artifacts under review, in a panel; a view of another feature. */
  Artifacts: ComponentType<{
    projectId: string
    artifacts: { id: string; title: string; version: number }[]
  }>
  /** The event log of the project; a view of another feature. */
  Console: ComponentType<{ projectId: string; afterLog: ReactNode; reviewOpen: boolean }>
}

/**
 * The review of a run: the artifact under review on the left half and the event log on the right
 * half, where the options of the checkpoint come under the last event.
 */
export function ReviewPage({ projectId, runId, Artifacts, Console }: ReviewPageProps) {
  const router = useRouter()
  const interrupt = usePendingInterrupt(runId)
  const closeTab = useEditorTabsStore((state) => state.closeTab)
  const href = `/projects/${encodeURIComponent(projectId)}/review/${encodeURIComponent(runId)}`

  // The review is one tab, with the artifact and the console split inside it.
  useEditorTab(projectTabGroup(projectId), {
    id: `review:${runId}`,
    title: 'Review',
    href,
    icon: 'review',
  })

  const backToConsole = () => {
    // An answered review has nothing left to show, so its tab closes.
    closeTab(projectTabGroup(projectId), `review:${runId}`)
    router.push(`/projects/${encodeURIComponent(projectId)}/console`)
  }

  if (interrupt.isPending) {
    return <LoadingState label="Loading the review" />
  }
  if (interrupt.isError) {
    return <ErrorState message={interrupt.error.message} onRetry={() => void interrupt.refetch()} />
  }
  if (interrupt.data === null) {
    return (
      <EmptyState
        title="This run waits for no review"
        description="The review was answered, or the run is not at a checkpoint."
        action={<Button onClick={backToConsole}>Back to the console</Button>}
      />
    )
  }

  const current = interrupt.data
  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full">
      <ResizablePanel id="review-artifacts" defaultSize="50%" minSize="25%">
        <div className={cn(surfaceClassName, 'h-full overflow-auto')}>
          <Artifacts
            projectId={projectId}
            artifacts={current.review_artifacts.map(({ artifact_id, title, version }) => ({
              id: artifact_id,
              title,
              version,
            }))}
          />
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel id="review-console" defaultSize="50%" minSize="25%">
        <div className={cn(surfaceClassName, 'h-full')}>
          <Console
            projectId={projectId}
            reviewOpen
            afterLog={<ReviewCard interrupt={current} onDone={backToConsole} />}
          />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
