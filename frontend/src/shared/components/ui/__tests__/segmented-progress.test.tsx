import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoAccessibilityViolations } from '@/test/steps'

import { SegmentedProgress, SegmentedProgressItem } from '../segmented-progress'
import { TooltipProvider } from '../tooltip'

function renderBar() {
  return render(
    <TooltipProvider>
      <SegmentedProgress label="Progress">
        <SegmentedProgressItem label="Interviews, done" tone="success" />
        <SegmentedProgressItem label="Analysis, running" tone="primary" isLive />
        <SegmentedProgressItem label="Specification, not started" isQuiet />
      </SegmentedProgress>
    </TooltipProvider>,
  )
}

describe('SegmentedProgress', () => {
  it('names the bar and each of its segments to a screen reader', async () => {
    const { container } = renderBar()

    const bar = screen.getByRole('group', { name: 'Progress' })
    expect(bar).toHaveTextContent('Interviews, doneAnalysis, runningSpecification, not started')
    await expectNoAccessibilityViolations(container)
  })

  it('draws a segment for each step, quiet only where it is asked to', () => {
    const { container } = renderBar()

    const lines = container.querySelectorAll('[data-quiet]')
    expect([...lines].map((line) => line.getAttribute('data-quiet'))).toEqual([
      'false',
      'false',
      'true',
    ])
  })

  it('breathes only in the segment that is live', () => {
    const { container } = renderBar()

    const lines = container.querySelectorAll('[data-live]')
    expect([...lines].map((line) => line.getAttribute('data-live'))).toEqual([
      'false',
      'true',
      'false',
    ])
  })
})
