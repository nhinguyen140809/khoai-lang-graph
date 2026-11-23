import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TypedText } from '../TypedText'

describe('TypedText', () => {
  it('gives the whole text to assistive technology once', () => {
    render(<TypedText text="What do you want" />)

    expect(screen.getByText('What do you want')).toHaveClass('sr-only')
  })

  it('shows each word in its own cell, one after the other', () => {
    const { container } = render(<TypedText text="What do you" step={100} delay={50} />)

    const cells = [...container.querySelectorAll<HTMLElement>('.word-cell')]

    expect(cells.map((cell) => cell.textContent)).toEqual(['What', 'do', 'you'])
    expect(cells.map((cell) => cell.style.animationDelay)).toEqual(['50ms', '150ms', '250ms'])
  })

  it('hides the words from assistive technology, which read the whole text', () => {
    const { container } = render(<TypedText text="What do" />)

    for (const cell of container.querySelectorAll('.word-cell')) {
      expect(cell).toHaveAttribute('aria-hidden', 'true')
    }
  })
})
