import { render } from '@testing-library/react'
import { motionValue } from 'motion/react'
import { describe, expect, it } from 'vitest'

import * as icons from '..'

const drawnIcons = Object.entries(icons).filter(([name]) => name !== 'SpinningIcon')

describe('the icons that a clock draws', () => {
  it.each(drawnIcons)(
    'draw %s at any point of the round, as an image hidden from assistive technology',
    (_name, Icon) => {
      const progress = motionValue(0)
      const { container } = render(<Icon progress={progress} />)
      for (const point of [0, 0.25, 0.5, 0.99, 1]) progress.set(point)

      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
      expect(svg?.querySelectorAll('path, rect, circle, line, polyline').length).toBeGreaterThan(0)
    },
  )
})
