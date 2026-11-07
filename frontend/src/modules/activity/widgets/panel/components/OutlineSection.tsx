'use client'

import { useRef } from 'react'

import type { Thread } from '@/modules/thread/entities'
import {
  messageAuthorLooks,
  useMessageDeliveryLook,
  useThreadMessages,
} from '@/modules/thread/entities'
import { SidePanelSection, useOpenPage } from '@/shared/components/frame'
import { EmptyState, ErrorState, LoadingState } from '@/shared/components/state'
import { Button } from '@/shared/components/ui/button'
import {
  Timeline,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineTitle,
} from '@/shared/components/ui/timeline'
import { firstLineOf } from '@/shared/lib/text'
import { formatDateTime } from '@/shared/lib/time'
import { useScrollIntoView } from '@/shared/lib/viewport'
import { routes } from '@/shared/routes'

import { activityPanelMessages } from '../activity-panel.constants'

interface OutlineSectionProps {
  thread: Thread | null
  projectId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/** Outline: the messages of the user, the newest at the bottom. */
export function OutlineSection({ thread, projectId, open, onOpenChange }: OutlineSectionProps) {
  const messages = useThreadMessages(thread?.id ?? '', {
    isEnabled: thread !== null,
    runStatus: undefined,
  })
  const list = useRef<HTMLDivElement>(null)
  const ofUser = (messages.data?.pages ?? [])
    .flatMap(({ items }) => items)
    .filter(({ author }) => messageAuthorLooks[author].isUser)
  const newestId = ofUser.at(-1)?.id ?? null
  useScrollIntoView(() => list.current?.lastElementChild as HTMLElement | null, newestId)

  if (thread === null) {
    return (
      <SidePanelSection
        title={activityPanelMessages.outline}
        open={open}
        onOpenChange={onOpenChange}
      >
        <EmptyState size="compact" title={activityPanelMessages.noMessages} />
      </SidePanelSection>
    )
  }

  return (
    <SidePanelSection title={activityPanelMessages.outline} open={open} onOpenChange={onOpenChange}>
      {messages.isPending && (
        <LoadingState size="compact" rows={3} label={activityPanelMessages.outlineLoading} />
      )}
      {messages.isError && (
        <ErrorState
          size="compact"
          message={activityPanelMessages.outlineError}
          onRetry={() => {
            void messages.refetch()
          }}
        />
      )}
      {messages.isSuccess &&
        (ofUser.length === 0 ? (
          <EmptyState size="compact" title={activityPanelMessages.noMessages} />
        ) : (
          <Timeline variant="compact" ref={list} className="gap-3 px-3 pb-2">
            {ofUser.map((message, index) => (
              <OutlineRow
                key={message.id}
                message={message}
                projectId={projectId}
                step={index + 1}
              />
            ))}
          </Timeline>
        ))}
    </SidePanelSection>
  )
}

/** One row of the outline: the dot in the tone of the delivery, its first line and the time. */
function OutlineRow({
  message,
  projectId,
  step,
}: {
  message: {
    id: string
    content: string
    created_at: string
    delivery: 'pending' | 'delivered' | 'started_run' | 'undelivered' | null
  }
  projectId: string
  step: number
}) {
  const look = useMessageDeliveryLook(message.delivery)
  const openPage = useOpenPage()

  return (
    <TimelineItem step={step}>
      <TimelineHeader>
        <TimelineIndicator color={look.tone} />
        <TimelineTitle className="min-w-0 flex-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start px-0"
            aria-label={[
              firstLineOf(message.content),
              look.label,
              formatDateTime(message.created_at),
            ]
              .filter((part) => part !== null && part !== '')
              .join(' ')}
            onClick={() => {
              openPage(routes.project(projectId).activity({ entryId: message.id }))
            }}
          >
            <span className="truncate">{firstLineOf(message.content)}</span>
          </Button>
        </TimelineTitle>
      </TimelineHeader>
      <TimelineDate>{formatDateTime(message.created_at)}</TimelineDate>
    </TimelineItem>
  )
}
