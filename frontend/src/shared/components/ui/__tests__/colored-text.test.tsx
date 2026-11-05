import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ColoredText } from '../colored-text'

describe('ColoredText', () => {
  it('takes the color it is given', () => {
    render(<ColoredText color="warning">To read</ColoredText>)

    expect(screen.getByText('To read')).toHaveClass('text-(--tone-strong)')
    expect(screen.getByText('To read')).toHaveAttribute('data-color', 'warning')
  })

  it('keeps the color of the text around it without a color', () => {
    render(<ColoredText>Approved</ColoredText>)

    expect(screen.getByText('Approved')).not.toHaveClass('text-(--tone-strong)')
    expect(screen.getByText('Approved')).not.toHaveAttribute('data-color')
  })

  it('writes the text muted with the color muted', () => {
    render(<ColoredText color="muted">Rejected</ColoredText>)

    expect(screen.getByText('Rejected')).toHaveAttribute('data-color', 'muted')
    expect(screen.getByText('Rejected')).toHaveClass('text-(--tone-strong)')
  })

  it('adds the classes it is given', () => {
    render(<ColoredText className="truncate">A long title</ColoredText>)

    expect(screen.getByText('A long title')).toHaveClass('truncate')
  })
})
