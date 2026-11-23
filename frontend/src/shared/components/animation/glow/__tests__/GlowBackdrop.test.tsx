import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { GlowBackdrop } from '../GlowBackdrop'

describe('GlowBackdrop', () => {
  it.each(['center', 'mirror', 'corners'] as const)(
    'draws two glows behind the page, hidden from assistive technology, in the %s arrangement',
    (arrangement) => {
      const { container } = render(<GlowBackdrop arrangement={arrangement} />)

      expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
      expect(container.querySelectorAll('[data-slot=glow]')).toHaveLength(2)
    },
  )

  it('keeps the glows of a corner arrangement large and softer than the others', () => {
    const { container } = render(<GlowBackdrop arrangement="corners" />)

    const shapes = [...container.querySelectorAll('[data-slot=glow] > div')]

    expect(shapes.every((shape) => shape.classList.contains('blur-glow'))).toBe(true)
  })
})
