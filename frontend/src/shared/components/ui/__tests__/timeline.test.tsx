import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoAccessibilityViolations } from '@/test/steps'

import {
  Timeline,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineTitle,
} from '../timeline'

describe('TimelineIndicator', () => {
  it('takes the muted fill of the install without a color', async () => {
    render(
      <Timeline>
        <TimelineItem step={0}>
          <TimelineHeader>
            <TimelineIndicator />
            <TimelineDate>2 Oct</TimelineDate>
            <TimelineTitle>Ideas</TimelineTitle>
          </TimelineHeader>
        </TimelineItem>
      </Timeline>,
    )

    const dot = screen
      .getByText('2 Oct')
      .closest('[data-slot="timeline-item"]')
      ?.querySelector('[data-slot="timeline-indicator"]')
    expect(dot).not.toHaveAttribute('data-color')
    await expectNoAccessibilityViolations()
  })

  it('takes the fill of the color it is given', () => {
    render(
      <Timeline>
        <TimelineItem step={0}>
          <TimelineHeader>
            <TimelineIndicator color="warning" />
            <TimelineDate>6 Oct</TimelineDate>
            <TimelineTitle>Also ask about group sessions.</TimelineTitle>
          </TimelineHeader>
        </TimelineItem>
      </Timeline>,
    )

    const dot = screen
      .getByText('6 Oct')
      .closest('[data-slot="timeline-item"]')
      ?.querySelector('[data-slot="timeline-indicator"]')
    expect(dot).toHaveAttribute('data-color', 'warning')
  })

  it('draws the compact variant with the dot in the row of the title and the date under it', async () => {
    render(
      <Timeline variant="compact">
        <TimelineItem step={1}>
          <TimelineHeader>
            <TimelineIndicator color="primary" />
            <TimelineTitle>Also ask about group sessions.</TimelineTitle>
          </TimelineHeader>
          <TimelineDate>6 Oct</TimelineDate>
        </TimelineItem>
      </Timeline>,
    )

    const item = screen
      .getByText('Also ask about group sessions.')
      .closest('[data-slot="timeline-item"]')
    const dot = item?.querySelector('[data-slot="timeline-indicator"]')
    expect(dot?.className).toContain('static')
    expect(screen.getByText('6 Oct')).toHaveClass('ps-3.5')
    await expectNoAccessibilityViolations()
  })
})
