import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Shimmer } from '../Shimmer'

describe('Shimmer', () => {
  it('lets the light cross the text, and holds it still for less motion', () => {
    render(<Shimmer>Working</Shimmer>)

    const text = screen.getByText('Working')
    expect(text).toHaveClass('shimmer')
    expect(text).toHaveClass('motion-reduce:shimmer-none')
  })

  it('takes the color of the interface for its light', () => {
    render(<Shimmer color="success">Working</Shimmer>)

    const text = screen.getByText('Working')
    expect(text).toHaveClass('shimmer-tone')
    expect(text.className).toContain('--tone-strong:var(--success-strong)')
  })

  it('crosses the text for as long as it is asked to', () => {
    render(<Shimmer duration={1200}>Working</Shimmer>)

    expect(screen.getByText('Working').style.getPropertyValue('--shimmer-duration')).toBe('1200ms')
  })

  it('holds the light still while it is not active', () => {
    render(<Shimmer isActive={false}>Working</Shimmer>)

    expect(screen.getByText('Working')).toHaveClass('shimmer-none')
  })

  it('puts the light on the element it wraps', () => {
    render(
      <Shimmer asChild>
        <strong>Working</strong>
      </Shimmer>,
    )

    expect(screen.getByText('Working').tagName).toBe('STRONG')
    expect(screen.getByText('Working')).toHaveClass('shimmer')
  })
})
