import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Rings } from '../Rings'

describe('Rings', () => {
  it('is a status that says the work goes on, unless it is hidden beside words', () => {
    const { rerender } = render(<Rings />)

    expect(screen.getByRole('status', { name: 'Working' })).toBeInTheDocument()

    rerender(<Rings aria-hidden />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('takes the primary and the secondary color, or the two that it is given', () => {
    const { container, rerender } = render(<Rings />)
    const strokes = () => [...container.querySelectorAll('path')].map((path) => path.style.stroke)

    expect(strokes()).toEqual(['var(--primary)', 'var(--secondary)'])

    rerender(<Rings colors={['red', 'blue']} />)

    expect(strokes()).toEqual(['red', 'blue'])
  })
})
