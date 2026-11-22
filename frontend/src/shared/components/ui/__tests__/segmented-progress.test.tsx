import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { stubResizeObserver } from '@/test/browser'
import { renderWithProviders } from '@/test/render'
import { expectNoAccessibilityViolations, hoverOver } from '@/test/steps'

import { SegmentedProgress, SegmentedProgressItem } from '../segmented-progress'

function renderBar(currentLabel?: string) {
  return renderWithProviders(
    <SegmentedProgress label="Progress" currentLabel={currentLabel}>
      <SegmentedProgressItem label="Interviews, done" tone="success" />
      <SegmentedProgressItem label="Analysis, running" tone="primary" isLive />
      <SegmentedProgressItem label="Specification, not started" isQuiet />
    </SegmentedProgress>,
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

describe('SegmentedProgress layout', () => {
  it('draws the segments apart while each has room', async () => {
    stubResizeObserver({ initialSize: { width: 288, height: 28 } })
    renderBar('Analysis, running')

    const bar = screen.getByRole('group', { name: 'Progress' })
    await waitFor(() => {
      expect(bar).toHaveAttribute('data-layout', 'segments')
    })
  })

  it('draws one line with no gap when the bar is too narrow for its segments, rounded at the ends only', async () => {
    stubResizeObserver({ initialSize: { width: 48, height: 28 } })
    const { container } = renderBar('Analysis, running')

    const bar = screen.getByRole('group', { name: 'Progress' })
    await waitFor(() => {
      expect(bar).toHaveAttribute('data-layout', 'continuous')
    })
    expect(bar).toHaveClass('data-[layout=continuous]:gap-0')
    const first = container.querySelector('[data-quiet]')
    expect(first).toHaveClass('group-first/segment:rounded-l-full')
  })

  it('names only the current step on hover when it is one line', async () => {
    stubResizeObserver({ initialSize: { width: 48, height: 28 } })
    renderBar('Analysis, running')
    const bar = screen.getByRole('group', { name: 'Progress' })
    await waitFor(() => {
      expect(bar).toHaveAttribute('data-layout', 'continuous')
    })

    await hoverOver(screen.getByRole('group', { name: 'Progress' }))

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Analysis, running')
  })
})
