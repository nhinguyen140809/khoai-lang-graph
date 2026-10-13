'use client'

import { useRouter } from 'next/navigation'
import { type ComponentType, type ReactNode, useEffect, useState } from 'react'

import { projectTabGroup, useEditorTab } from '@/frame'
import { EmptyState, ErrorState, LoadingState } from '@/shared/components/state'
import { consoleHref, reviewHref } from '@/shared/config/routes.utils'
import { Button } from '@/shared/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/shared/ui/resizable'
import { ScrollArea } from '@/shared/ui/scroll-area'
import { Surface } from '@/shared/ui/surface'

import { usePendingInterrupt } from '../hooks/usePendingInterrupt'
import { ReviewTabIcon } from '../review-frame.config'
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
  const href = reviewHref(projectId, runId)

  // The review is one tab, with the artifact and the console split inside it.
  const tab = useEditorTab(projectTabGroup(projectId), {
    id: `review:${runId}`,
    title: 'Review',
    href,
    icon: ReviewTabIcon.Review,
  })

  const backToConsole = () => {
    // An answered review has nothing left to show, so its tab closes.
    tab.close()
    router.push(consoleHref(projectId))
  }

  // A review that was open and is gone has been answered: the page goes back to the console at
  // once, without the message that no review waits.
  const [hadReview, setHadReview] = useState(false)
  if (!hadReview && interrupt.data !== undefined && interrupt.data !== null) setHadReview(true)
  const answered = hadReview && interrupt.data === null
  useEffect(() => {
    if (answered) backToConsole()
  })

  if (interrupt.isPending || answered) {
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
        <Surface className="h-full">
          <ScrollArea className="h-full">
            <Artifacts
              projectId={projectId}
              artifacts={current.review_artifacts.map(({ artifact_id, title, version }) => ({
                id: artifact_id,
                title,
                version,
              }))}
            />
          </ScrollArea>
        </Surface>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel id="review-console" defaultSize="50%" minSize="25%">
        <Surface className="h-full">
          <Console
            projectId={projectId}
            reviewOpen
            afterLog={<ReviewCard interrupt={current} onDone={backToConsole} />}
          />
        </Surface>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
