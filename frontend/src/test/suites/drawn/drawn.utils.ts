import { render } from '@testing-library/react'
import { motionValue } from 'motion/react'
import { createElement } from 'react'
import { expect, it } from 'vitest'

import type { DrawnThing } from './drawn.types'

/** The shapes a drawn thing may draw with, whichever of them it uses. */
const shapes = 'path, rect, circle, line, polyline'

/**
 * Tests that each thing a clock draws, draws at any point of its round, as an image hidden from
 * assistive technology with at least one shape of its own.
 */
export function itDrawsEachOf(things: readonly DrawnThing[]) {
  it.each(things)(
    'draws %s at any point of the round, as an image hidden from assistive technology',
    (_name, Thing) => {
      const progress = motionValue(0)
      const { container } = render(createElement(Thing, { progress }))
      for (const point of [0, 0.25, 0.5, 0.99, 1]) progress.set(point)

      expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
      expect(container.querySelectorAll(shapes).length).toBeGreaterThan(0)
    },
  )
}
