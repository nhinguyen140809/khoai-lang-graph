'use client'

import { Button } from '@/shared/components/ui/button'
import {
  Timeline,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineTitle,
} from '@/shared/components/ui/timeline'

import { timelineRows } from '../../design-system.fixtures'
import { SampleCard } from '../Sample'

/** The outline as the side panel of the activity draws it: a dot, the first line of the message as a button, and its time. */
export function TimelineCard() {
  return (
    <SampleCard
      title="Outline"
      description="The messages of the user, the newest at the bottom; the dot shows how the message was delivered."
      className="flex flex-col gap-3"
    >
      <Timeline variant="compact" className="gap-3 px-3 pb-2">
        {timelineRows.map(({ key, date, title, tone }, index) => (
          <TimelineItem key={key} step={index + 1}>
            <TimelineHeader>
              <TimelineIndicator color={tone} />
              <TimelineTitle className="min-w-0 flex-1">
                <Button variant="ghost" size="sm" className="w-full justify-start px-0">
                  <span className="truncate">{title}</span>
                </Button>
              </TimelineTitle>
            </TimelineHeader>
            <TimelineDate>{date}</TimelineDate>
          </TimelineItem>
        ))}
      </Timeline>
    </SampleCard>
  )
}
