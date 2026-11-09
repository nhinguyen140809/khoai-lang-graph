import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { tones } from '@/shared/lib/tone'

import { Node } from '../node'

const variants = ['outline', 'soft', 'solid'] as const

describe('Node', () => {
  it('names its variant and color on the element, for every look it can take', () => {
    for (const variant of variants) {
      for (const color of tones) {
        const { container } = render(<Node variant={variant} color={color} />)

        const node = container.querySelector('[data-slot="node"]')
        expect(node).toHaveAttribute('data-variant', variant)
        expect(node).toHaveAttribute('data-color', color)
      }
    }
  })

  it('is an outline of the neutral color without a look', () => {
    const { container } = render(<Node />)

    const node = container.querySelector('[data-slot="node"]')
    expect(node).toHaveAttribute('data-variant', 'outline')
    expect(node).toHaveAttribute('data-color', 'neutral')
  })

  it('draws the border of the tone for an outline or soft node, and none for a solid one', () => {
    const outline = render(<Node variant="outline" color="warning" />).container.firstElementChild
    const soft = render(<Node variant="soft" color="warning" />).container.firstElementChild
    const solid = render(<Node variant="solid" color="warning" />).container.firstElementChild

    expect(outline).toHaveClass('border-(--tone-border)')
    expect(soft).toHaveClass('border-(--tone-border)')
    expect(solid).toHaveClass('border-transparent')
  })

  it('rings the node a screen is about from its data-focus attribute, in the color of its own tone', () => {
    const { container } = render(<Node data-focus />)

    expect(container.firstElementChild).toHaveClass('data-focus:ring-(--tone-strong)')
    expect(container.firstElementChild).toHaveAttribute('data-focus', 'true')
  })

  it('draws a node faded from its isFaded prop, and plain without it', () => {
    const faded = render(<Node isFaded />).container.firstElementChild
    const plain = render(<Node />).container.firstElementChild

    expect(faded).toHaveAttribute('data-faded')
    expect(faded).toHaveClass('data-faded:opacity-60')
    // A dashed border says that the node is set aside, whatever its color.
    expect(faded).toHaveClass('data-faded:border-dashed')
    expect(plain).not.toHaveAttribute('data-faded')
  })
})
