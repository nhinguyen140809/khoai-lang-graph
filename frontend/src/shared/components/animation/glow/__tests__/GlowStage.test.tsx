import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { GlowStage } from '../GlowStage'

describe('GlowStage', () => {
  it('holds its content over a backdrop of two glows, and gives the backdrop what it needs of a page', () => {
    const { container } = render(
      <GlowStage className="flex">
        <p>Content</p>
      </GlowStage>,
    )

    const stage = container.firstElementChild
    expect(stage).toHaveClass('relative', 'isolate', 'overflow-hidden', 'bg-background', 'flex')
    expect(stage?.querySelectorAll('[data-slot=glow]')).toHaveLength(2)
    expect(stage).toHaveTextContent('Content')
  })

  it('can be a landmark, with its own arrangement and backdrop', () => {
    const { container } = render(
      <GlowStage as="main" arrangement="corners" backdropClassName="h-160">
        <p>Content</p>
      </GlowStage>,
    )

    expect(container.querySelector('main')).not.toBeNull()
    expect(container.querySelector('.h-160')).not.toBeNull()
  })
})
