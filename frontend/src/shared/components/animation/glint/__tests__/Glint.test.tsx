import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Glint } from '../Glint'

describe('Glint', () => {
  it('is a status named Working, unless it is hidden beside words', () => {
    const { rerender } = render(<Glint />)
    expect(screen.getByRole('status', { name: 'Working' })).toBeInTheDocument()

    rerender(<Glint aria-hidden />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it.each([
    ['solid', 'glint-solid'],
    ['mesh', 'glint-mesh'],
    ['shift', 'glint-shift'],
  ] as const)('fills the star and its glow with the %s fill', (variant, fill) => {
    const { container } = render(<Glint variant={variant} />)

    expect(container.querySelectorAll(`.${fill}`)).toHaveLength(2)
  })

  it('gives the two colors to the star as custom properties', () => {
    const { container } = render(<Glint variant="mesh" colors={['red', 'blue']} />)

    expect(container.querySelector('.glint-mesh')).toHaveStyle({
      '--glint-a': 'red',
      '--glint-b': 'blue',
    })
  })
})
