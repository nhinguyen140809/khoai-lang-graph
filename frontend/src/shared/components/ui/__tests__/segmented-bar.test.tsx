import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoAccessibilityViolations } from '@/test/steps'

import { SegmentedBar } from '../segmented-bar'

function filledSegments(container: HTMLElement) {
  return container.querySelectorAll('[data-filled="true"]').length
}

describe('SegmentedBar', () => {
  it('draws one segment for each step of the scale and fills as many as the value says', () => {
    const { container } = render(<SegmentedBar value={4} label="High" />)

    expect(container.querySelectorAll('[data-filled]')).toHaveLength(5)
    expect(filledSegments(container)).toBe(4)
  })

  it('says its value and its scale to a screen reader', async () => {
    const { container } = render(<SegmentedBar value={2} label="Low" />)

    const meter = screen.getByRole('meter', { name: 'Low' })
    expect(meter).toHaveAttribute('aria-valuenow', '2')
    expect(meter).toHaveAttribute('aria-valuemin', '1')
    expect(meter).toHaveAttribute('aria-valuemax', '5')
    await expectNoAccessibilityViolations(container)
  })

  it('follows the scale that it is given', () => {
    const { container } = render(<SegmentedBar value={7} min={0} max={10} label="7 of 10" />)

    expect(container.querySelectorAll('[data-filled]')).toHaveLength(11)
    expect(filledSegments(container)).toBe(8)
  })

  it('stays inside its scale for a value that is above or below it', () => {
    const above = render(<SegmentedBar value={9} label="High" />)
    const below = render(<SegmentedBar value={-3} label="Low" />)

    expect(filledSegments(above.container)).toBe(5)
    expect(filledSegments(below.container)).toBe(0)
  })
})
