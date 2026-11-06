'use client'

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

export function TimelineCard() {
  return (
    <SampleCard
      title="Outline"
      description="The messages of the user, the newest at the bottom."
      className="flex flex-col gap-3"
    >
      <Timeline>
        {timelineRows.map(({ key, date, title, tone }, index) => (
          <TimelineItem key={key} step={index}>
            <TimelineHeader>
              <TimelineIndicator color={tone} />
              <TimelineDate>{date}</TimelineDate>
              <TimelineTitle className="truncate">{title}</TimelineTitle>
            </TimelineHeader>
          </TimelineItem>
        ))}
      </Timeline>
    </SampleCard>
  )
}
