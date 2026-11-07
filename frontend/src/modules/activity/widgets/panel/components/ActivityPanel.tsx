'use client'

import { useEffect, useState } from 'react'

import { useActivityThread } from '@/modules/activity/entities'
import { useLatestRun } from '@/modules/run/entities'
import { SidePanel } from '@/shared/components/frame'
import { ErrorState, LoadingState } from '@/shared/components/state'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  usePanelRef,
} from '@/shared/components/ui/resizable'
import { ScrollArea } from '@/shared/components/ui/scroll-area'

import { activityPanelMessages } from '../activity-panel.constants'
import { OutlineSection } from './OutlineSection'
import { ProgressSection } from './ProgressSection'

interface ActivityPanelProps {
  projectId: string
}

/** The side panel of Activity: the progress of the stages and the outline of the messages. */
export function ActivityPanel({ projectId }: ActivityPanelProps) {
  const thread = useActivityThread(projectId)
  const latestRun = useLatestRun(thread.state === 'success' ? (thread.thread?.id ?? '') : '', {
    isEnabled: thread.state === 'success' && thread.thread !== null,
  })
  const progressPanel = usePanelRef()
  const outlinePanel = usePanelRef()
  const [isProgressOpen, setProgressOpen] = useState(true)
  const [isOutlineOpen, setOutlineOpen] = useState(true)

  useEffect(() => {
    if (isProgressOpen) progressPanel.current?.expand()
    else progressPanel.current?.collapse()
  }, [isProgressOpen, progressPanel])

  useEffect(() => {
    if (isOutlineOpen) outlinePanel.current?.expand()
    else outlinePanel.current?.collapse()
  }, [isOutlineOpen, outlinePanel])

  if (thread.state === 'pending') {
    return <LoadingState size="compact" rows={4} label={activityPanelMessages.loading} />
  }
  if (thread.state === 'error') {
    return (
      <ErrorState
        size="compact"
        message={activityPanelMessages.loadError}
        onRetry={() => {
          thread.retry()
        }}
      />
    )
  }

  return (
    <SidePanel title={activityPanelMessages.title} isScrollable={false}>
      <ResizablePanelGroup orientation="vertical" className="min-h-0">
        <ResizablePanel
          defaultSize="55"
          minSize="20"
          collapsedSize={40}
          collapsible
          panelRef={progressPanel}
          className="min-h-0"
        >
          <ScrollArea className="h-full">
            {thread.thread === null ? (
              <ProgressSection
                run={null}
                projectId={projectId}
                open={isProgressOpen}
                onOpenChange={setProgressOpen}
              />
            ) : latestRun.isPending ? (
              <LoadingState size="compact" rows={5} label={activityPanelMessages.progressLoading} />
            ) : latestRun.isError ? (
              <ErrorState
                size="compact"
                message={activityPanelMessages.progressError}
                onRetry={() => {
                  void latestRun.refetch()
                }}
              />
            ) : (
              <ProgressSection
                run={latestRun.data}
                projectId={projectId}
                open={isProgressOpen}
                onOpenChange={setProgressOpen}
              />
            )}
          </ScrollArea>
        </ResizablePanel>
        {/*
         * The line between the sections spans the panel, with room around it to grab; the grip
         * of the handle is the line itself.
         */}
        <ResizableHandle className="before:absolute before:inset-x-0 before:top-1/2 before:h-px before:-translate-y-1/2 before:bg-border" />
        <ResizablePanel
          defaultSize="45"
          minSize="20"
          collapsedSize={40}
          collapsible
          panelRef={outlinePanel}
          className="min-h-0"
        >
          <ScrollArea className="h-full">
            <OutlineSection
              thread={thread.thread}
              projectId={projectId}
              open={isOutlineOpen}
              onOpenChange={setOutlineOpen}
            />
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </SidePanel>
  )
}
