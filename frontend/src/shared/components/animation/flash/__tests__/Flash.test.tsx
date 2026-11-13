import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Flash } from '../Flash'

describe('Flash', () => {
  it('stays still on the first value', () => {
    render(<Flash flashKey={1}>value</Flash>)

    expect(screen.getByText('value')).not.toHaveClass('animate-flash')
  })

  it('lights up when the value changes', () => {
    const { rerender } = render(<Flash flashKey={1}>one</Flash>)

    rerender(<Flash flashKey={2}>two</Flash>)

    expect(screen.getByText('two')).toHaveClass('animate-flash')
  })

  it('takes the color of the interface that it is given, the primary color without one', () => {
    const { rerender } = render(<Flash flashKey={1}>value</Flash>)
    expect(screen.getByText('value')).toHaveAttribute('data-color', 'primary')

    rerender(
      <Flash flashKey={1} color="success">
        value
      </Flash>,
    )
    expect(screen.getByText('value')).toHaveAttribute('data-color', 'success')
    expect(screen.getByText('value').className).toContain('--tone-strong:var(--success-strong)')
  })

  it('fades for as long as it is asked to', () => {
    render(
      <Flash flashKey={1} duration={2400}>
        value
      </Flash>,
    )

    expect(screen.getByText('value')).toHaveStyle({ animationDuration: '2400ms' })
  })
})
